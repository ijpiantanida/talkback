import {ReqRes} from "../../src/types"

export default class Factories {
  static reqRes(reqRes: Partial<ReqRes>) {
    const defaultReqRes: ReqRes = {
      body: Buffer.from("FOOBAR"),
      headers: {}
    }

    return {...defaultReqRes, ...reqRes}
  }
}
