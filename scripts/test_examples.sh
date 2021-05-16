#! /bin/bash

yarn --cwd examples/request-handler test && \
yarn --cwd examples/server test && \
yarn --cwd examples/unit-tests test
