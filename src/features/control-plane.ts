import { Logger } from "../logger";
import { Options } from "../options";
import { HttpRequest, HttpResponse, Req } from "../types";
import { SequenceManager } from "./sequence";
import { ControlPlaneRequestHandlerContext, ControlPlaneResponseBody } from "./types";


export class ControlPlane {
    private readonly options: Options
    private readonly logger: Logger
    sequenceManager: SequenceManager;
  
    constructor(sequenceManager: SequenceManager, options: Options) {
      this.options = options
      this.sequenceManager = sequenceManager
  
      this.logger = Logger.for(this.options)
    }

    isControlPlaneRequest(req: HttpRequest): boolean {
        if(!this.options.controlPlane.enabled) {
            return false
        }
        return req.url.startsWith(this.options.controlPlane.path)
    }

    async defaultHandler(req: HttpRequest, context: ControlPlaneRequestHandlerContext): Promise<ControlPlaneResponseBody | undefined> {
        if(req.method == 'POST' && context.cleanUrl.startsWith("/sequence/reset")) {
            this.sequenceManager.reset()
            return "OK"
        }
        return undefined
    }

    async handleRequest(req: HttpRequest): Promise<HttpResponse> {
        this.logger.debug(`Handling ControlPlane request url=${req.url} method=${req.method}`)

        const context: ControlPlaneRequestHandlerContext = {
            cleanUrl: this.cleanUrl(req)
        }

        let body = await this.defaultHandler(req, context)
        if(!body && this.options.controlPlane.requestHandler) {
            body = await this.options.controlPlane.requestHandler(req, context)
        }
        if(body == undefined) {
            this.logger.error("Unknown ControlPanel request url=${req.url} method=${req.method}")
            return {
                status: 404,
                headers: {},
                body: Buffer.from("")
            }
        }

        return {
            status: 200,
            headers: {},
            body: Buffer.from(body || "")
          } as HttpResponse
    }

    private cleanUrl(req: Req): string {
        if(!this.isControlPlaneRequest(req)) {
            throw new Error("Cleaning control plane URL for non control plane request")
        }
        return req.url.substring(this.options.controlPlane.path.length)
    }
}