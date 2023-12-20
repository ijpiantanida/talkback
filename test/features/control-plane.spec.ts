import { expect } from "chai"
import { ControlPlane } from "../../src/features/control-plane"
import OptionsFactory, { Options } from "../../src/options"
import { Req } from "../../src/types"
import { SequenceManager } from "../../src/features/sequence"


describe("ControlPlane", () => {
    let controlPlane: ControlPlane
    let sequenceManager: SequenceManager
    let options: Options
    let req: Req

    beforeEach(() => {
        req = {
            url: "/",
            method: "GET",
            headers: {},
            body: Buffer.from("FOOBAR")
        }

        options = OptionsFactory.prepare({silent: true, controlPlane: {
            enabled: true,
            path: '__talkback__test__',
            requestHandler: undefined,
        }})
        sequenceManager = new SequenceManager(options)
        controlPlane = new ControlPlane(sequenceManager, options)
    }) 

    describe("isControlPlaneRequest", () => {
        it("returns true if enabled and request matches control plane path", () => {
            req.url = options.controlPlane.path
            expect(controlPlane.isControlPlaneRequest(req)).to.eql(true)

            req.url = options.controlPlane.path + "/test"
            expect(controlPlane.isControlPlaneRequest(req)).to.eql(true)
        })

        it("returns false if not enabled and request matches control plane path", () => {
            req.url = options.controlPlane.path + "/test"
            options.controlPlane.enabled = false

            expect(controlPlane.isControlPlaneRequest(req)).to.eql(false)
        })

        it("returns false if enabled and request does nto matches control plane path", () => {
            req.url = "random_path/test"

            expect(controlPlane.isControlPlaneRequest(req)).to.eql(false)
        })
    })

    describe("handleRequest", () => {
        describe("default handler", () => {
            describe("sequence", () => {
                it("/sequence/reset resets sequenceManager", async () => {
                    sequenceManager.next()
                    sequenceManager.next()

                    expect(sequenceManager.nextSequenceNumber).to.eql(3)

                    req.method = "POST"
                    req.url = options.controlPlane.path + "/sequence/reset"

                    await controlPlane.handleRequest(req)

                    expect(sequenceManager.nextSequenceNumber).to.eql(1)
                })
            })
        })

        it("returns a 404 for unknown requests", async () => {
            req.url = options.controlPlane.path + "/invalid"
            const response = await controlPlane.handleRequest(req)

            expect(response.status).to.equal(404)
        })

        it("uses the options.controlPlane.requestHandler", async () => {
            let handlerRan = false

            options.controlPlane.requestHandler = async (req) => {
                expect(req.url).to.equal(options.controlPlane.path + "/test")
                handlerRan = true
                return "test body"
            }

            req.url = options.controlPlane.path + "/test"
            const response = await controlPlane.handleRequest(req)

            expect(handlerRan).to.equal(true)
            expect(response.status).to.equal(200)
            expect(response.body.toString()).to.equal("test body")
        })
    })
})