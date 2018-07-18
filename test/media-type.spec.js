import MediaType from "../src/media-type"

describe("MediaType", () => {
  describe("isHumanReadable", () => {
    it("returns true when the content-type is human readable and there's no content-encoding", () => {
      const res = {
        headers: {
          "content-type": ["application/json"]
        }
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.true
    })

    it("returns false when the content-type is not human readable", () => {
      const res = {
        headers: {
          "content-type": ["img/png"]
        }
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.false
    })

    it("returns true when the content-type is human readable and the content-encoding is identity", () => {
      const res = {
        headers: {
          "content-encoding": ["identity"],
          "content-type": ["application/json"]
        }
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.true
    })

    it("returns false when the content-type is human readable and the content-encoding is gzip", () => {
      const res = {
        headers: {
          "content-encoding": ["gzip"],
          "content-type": ["application/json"]
        }
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.false
    })
  })
})