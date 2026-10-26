#! /bin/bash

pnpm --dir examples/request-handler test && \
pnpm --dir examples/server test && \
pnpm --dir examples/unit-tests test
