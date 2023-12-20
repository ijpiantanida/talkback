import { HttpRequest } from "../types"

export type ControlPlaneRequestHandlerContext = {
    cleanUrl: string,
}

export type ControlPlaneResponseBody = WithImplicitCoercion<Uint8Array | ReadonlyArray<number> | string> | undefined
export type ControlPlaneRequestHandler = (req: HttpRequest, context: ControlPlaneRequestHandlerContext) => Promise<ControlPlaneResponseBody>