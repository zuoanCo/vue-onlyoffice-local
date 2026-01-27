// types/x2t.d.ts - 类型定义文件
interface EmscriptenFileSystem {
    mkdir(path: string): void
    readdir(path: string): string[]
    readFile(path: string, options?: { encoding: 'binary' }): Uint8Array
    writeFile(path: string, data: Uint8Array | string): void
}

interface EmscriptenModule {
    FS: EmscriptenFileSystem
    ccall: (funcName: string, returnType: string, argTypes: string[], args: any[]) => number
    onRuntimeInitialized: () => void
}

export interface ConversionResult {
    fileName: string
    type: string
    bin: Uint8Array
    media: Record<string, string>
}

export interface BinConversionResult {
    fileName: string
    data: Uint8Array
}

type DocumentType = 'word' | 'cell' | 'slide'

declare global {
    interface Window {
        Module: EmscriptenModule
    }
}

/**
 * X2T 工具类 - 负责文档转换功能
 */
class X2TConverter {
    private x2tModule: EmscriptenModule | null = null
    private isReady = false
    private initPromise: Promise<EmscriptenModule> | null = null
    private hasScriptLoaded = false
    private scriptPath = 'libs/x2t.js' // Default path

    // 支持的文件类型映射
    private readonly DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
        docx: 'word',
        doc: 'word',
        odt: 'word',
        rtf: 'word',
        txt: 'word',
        xlsx: 'cell',
        xls: 'cell',
        ods: 'cell',
        csv: 'cell',
        pptx: 'slide',
        ppt: 'slide',
        odp: 'slide',
    }

    private readonly WORKING_DIRS = [
        '/working',
        '/working/media',
        '/working/fonts',
        '/working/themes',
    ]
    private readonly INIT_TIMEOUT = 20000

    public setScriptPath(path: string) {
        this.scriptPath = path;
    }

    /**
     * 加载 X2T 脚本文件
     */
    async loadScript(): Promise<void> {
        if (this.hasScriptLoaded) return

        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = this.scriptPath
            script.onload = () => {
                this.hasScriptLoaded = true
                console.log('X2T WASM script loaded successfully')
                resolve()
            }

            script.onerror = (error) => {
                const errorMsg = `Failed to load X2T WASM script from ${this.scriptPath}`
                console.error(errorMsg, error)
                reject(new Error(errorMsg))
            }

            document.head.appendChild(script)
        })
    }

    /**
     * 初始化 X2T 模块
     */
    async initialize(): Promise<EmscriptenModule> {
        if (this.isReady && this.x2tModule) {
            return this.x2tModule
        }

        // 防止重复初始化
        if (this.initPromise) {
            return this.initPromise
        }

        this.initPromise = this.doInitialize()
        return this.initPromise
    }

    private async doInitialize(): Promise<EmscriptenModule> {
        try {
            return new Promise((resolve, reject) => {
                // 如果已经有 Module 全局变量，可能需要检查状态
                if (window.Module && typeof window.Module.onRuntimeInitialized === 'function') {
                     // 可能是之前的残留
                }

                // 预定义 Module 配置
                window.Module = {
                    onRuntimeInitialized: () => {
                        console.log('X2T Runtime initialized via global config');
                        try {
                            this.finishInit(window.Module);
                            resolve(window.Module);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    print: (text: string) => console.log('[x2t stdout]', text),
                    printErr: (text: string) => console.warn('[x2t stderr]', text),
                    // 必须指定 locateFile，否则 x2t.js 可能找不到 x2t.wasm
                    locateFile: (path: string, prefix: string) => {
                        if (path.endsWith('.wasm')) {
                            // 假设 wasm 在同级目录，或者根据 scriptPath 推断
                            // 简单起见，我们假设它在 public/wasm/x2t/x2t.wasm
                            // 或者我们可以让用户配置
                            return this.scriptPath.replace('.js', '.wasm');
                        }
                        return prefix + path;
                    }
                } as any;

                // 确保脚本已加载
                this.loadScript().catch(reject);
            })
        } catch (error) {
            this.initPromise = null // 重置以允许重试
            throw error
        }
    }

    private finishInit(x2t: EmscriptenModule) {
        console.log('x2t module keys:', Object.keys(x2t));
        // @ts-ignore
        console.log('HEAPU8 exists:', !!x2t.HEAPU8);
        // @ts-ignore
        console.log('FS exists:', !!x2t.FS);
        
        this.createWorkingDirectories(x2t)
        this.x2tModule = x2t
        this.isReady = true
        console.log('X2T module initialized successfully')
    }

    /**
     * 创建工作目录
     */
    private createWorkingDirectories(x2t: EmscriptenModule): void {
        this.WORKING_DIRS.forEach((dir) => {
            try {
                // @ts-ignore
                x2t.FS.mkdir(dir)
            } catch (error) {
                // 目录可能已存在，忽略错误
                // console.warn(`Directory ${dir} may already exist:`, error)
            }
        })
    }

    /**
     * 获取文档类型
     */
    private getDocumentType(extension: string): DocumentType {
        const docType = this.DOCUMENT_TYPE_MAP[extension.toLowerCase()]
        if (!docType) {
            throw new Error(`Unsupported file format: ${extension}`)
        }
        return docType
    }

    /**
     * 清理文件名
     */
    private sanitizeFileName(input: string): string {
        if (typeof input !== 'string' || !input.trim()) {
            return 'file.bin'
        }

        const parts = input.split('.')
        const ext = parts.pop() || 'bin'
        const name = parts.join('.')

        const illegalChars = /[\/\?<>\\:\*\|"]/g
        const controlChars = /[\x00-\x1f\x80-\x9f]/g
        const reservedPattern = /^\.+$/
        const unsafeChars = /[&'%!"{}[\]]/g

        let sanitized = name
            .replace(illegalChars, '')
            .replace(controlChars, '')
            .replace(reservedPattern, '')
            .replace(unsafeChars, '')

        sanitized = sanitized.trim() || 'file'
        return `${sanitized.slice(0, 200)}.${ext}` // 限制长度
    }

    /**
     * 执行文档转换
     */
    private executeConversion(paramsPath: string): void {
        if (!this.x2tModule) {
            throw new Error('X2T module not initialized')
        }

        const result = this.x2tModule.ccall('main1', 'number', ['string'], [paramsPath])
        if (result !== 0) {
            throw new Error(`Conversion failed with code: ${result}`)
        }
    }

    /**
     * 创建转换参数XML
     */
    private createConversionParams(
        fromPath: string,
        toPath: string,
        additionalParams = '',
    ): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<TaskQueueDataConvert xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <m_sFileFrom>${fromPath}</m_sFileFrom>
  <m_sThemeDir>/working/themes</m_sThemeDir>
  <m_sFileTo>${toPath}</m_sFileTo>
  <m_bIsNoBase64>false</m_bIsNoBase64>
  ${additionalParams}
</TaskQueueDataConvert>`
    }

    /**
     * 读取媒体文件
     */
    private readMediaFiles(): Record<string, string> {
        if (!this.x2tModule) return {}

        const media: Record<string, string> = {}

        try {
            // @ts-ignore
            const files = this.x2tModule.FS.readdir('/working/media/')

            files
                // @ts-ignore
                .filter((file) => file !== '.' && file !== '..')
                // @ts-ignore
                .forEach((file) => {
                    try {
                        // @ts-ignore
                        const fileData = this.x2tModule!.FS.readFile(`/working/media/${file}`, {
                            encoding: 'binary',
                        })

                        const blob = new Blob([fileData as any])
                        const mediaUrl = URL.createObjectURL(blob)
                        media[`media/${file}`] = mediaUrl
                    } catch (error) {
                        console.warn(`Failed to read media file ${file}:`, error)
                    }
                })
        } catch (error) {
            console.warn('Failed to read media directory:', error)
        }

        return media
    }

    /**
     * 将文档转换为 bin 格式
     */
    async convertDocument(file: File): Promise<ConversionResult> {
        await this.initialize()

        const fileName = file.name
        const fileExt = fileName.split('.').pop()?.toLowerCase() || ''
        const documentType = this.getDocumentType(fileExt)

        try {
            // 读取文件内容
            console.log('Reading file:', fileName);
            const arrayBuffer = await file.arrayBuffer()
            if (!arrayBuffer) {
                throw new Error('File buffer is empty or undefined');
            }
            const data = new Uint8Array(arrayBuffer)
            console.log('File read successfully, size:', data.length);

            // 生成安全的文件名
            const sanitizedName = this.sanitizeFileName(fileName)
            const inputPath = `/working/${sanitizedName}`
            const outputPath = `${inputPath}.bin`

            // 写入文件到虚拟文件系统
            // @ts-ignore
            console.log('Writing to FS:', inputPath);
            this.x2tModule!.FS.writeFile(inputPath, data)

            // 创建转换参数
            const params = this.createConversionParams(inputPath, outputPath)
            // @ts-ignore
            console.log('Writing params to FS');
            this.x2tModule!.FS.writeFile('/working/params.xml', params)

            // 执行转换
            console.log('Executing conversion...');
            this.executeConversion('/working/params.xml')
            console.log('Conversion executed.');

            // 读取转换结果
            // @ts-ignore
            const result = this.x2tModule!.FS.readFile(outputPath)
            const media = this.readMediaFiles()

            return {
                fileName: sanitizedName,
                type: documentType,
                bin: result,
                media,
            }
        } catch (error) {
            throw new Error(
                `Document conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
        }
    }

    /**
     * 销毁实例，清理资源
     */
    destroy(): void {
        this.x2tModule = null
        this.isReady = false
        this.initPromise = null
        console.log('X2T converter destroyed')
    }
}

// 单例实例
const x2tConverter = new X2TConverter()

export const initX2T = (scriptPath?: string) => {
    if (scriptPath) x2tConverter.setScriptPath(scriptPath);
    return x2tConverter.initialize();
}
export const convertDocument = (file: File) => x2tConverter.convertDocument(file)

// 文件类型常量
export const oAscFileType = {
    // ... (rest of the constants if needed, omitting for brevity as they are mainly for saving/exporting which is advanced)
} as const
