import { Logger } from "../logger";
import { Options } from "../options";
import { HttpRequest, HttpResponse } from "../types";

export type ControlPlaneRequestHandler = (req: HttpRequest) => Promise<HttpResponse>

export class ControlPlane {
    private readonly options: Options
    private readonly logger: Logger
  
    constructor(options: Options) {
      this.options = options
  
      this.logger = Logger.for(this.options)
    }

    isControlPlaneRequest(req: HttpRequest): boolean {
        return req.url.startsWith(this.options.controlPlane.path)
    }

    async handleRequest(req: HttpRequest): Promise<HttpResponse> {
        return this.options.controlPlane.requestHandler(req)
    }
}