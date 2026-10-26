## Request Handler Example

Example of talkback used as a library where requests are routed by the user.   
Multiple request handlers are instantiated for different hosts.   

 
Run `pnpm install --frozen-lockfile` in this directory, then `pnpm test`. Build talkback first with `pnpm run build` from the repository root.

The `index.html` page is loaded with puppeteer. Requests are then intercepted and proxied through talkback with a portion of the response content rendered to the page. The test then asserts that the page has the expected content.   


The original tape responses were modified so that it's obvious if the tape is not being served.
