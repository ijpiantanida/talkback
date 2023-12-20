#!/usr/bin/env bash

BASE_URL="http://localhost:8080"

error=false

function make_request() {
  status=$(curl -k -o /dev/null -s -w "%{http_code}" "${@:2}")
  if [ "$status" -ne "$1" ]; then
    error=true
    echo "Request "${@:2}" failed with status $status (expected $1)"
  fi
}

# reset sequence
make_request 200 "$BASE_URL/__talkback__/sequence/reset" -X POST

# Get requests in sequence order
make_request 200 "$BASE_URL/carts/1"
make_request 200 "$BASE_URL/user" # this doesn't affect sequence
make_request 200 "$BASE_URL/carts/1" -X PUT
make_request 200 "$BASE_URL/carts/1"

# reset sequence
make_request 200 "$BASE_URL/__talkback__/sequence/reset" -X POST

# Get requests in sequence order again
make_request 200 "$BASE_URL/carts/1"
make_request 200 "$BASE_URL/carts/1" -X PUT
make_request 200 "$BASE_URL/user" # this doesn't affect sequence
make_request 200 "$BASE_URL/carts/1"

# Out of sequence
make_request 404 "$BASE_URL/carts/1"
make_request 200 "$BASE_URL/user" # this doesn't affect sequence

# reset sequence
make_request 200 "$BASE_URL/__talkback__/sequence/reset" -X POST

# Out of sequence - fails
make_request 200 "$BASE_URL/carts/1"
make_request 404 "$BASE_URL/carts/1"

if [ "$error" = true ]; then
  echo "FAILED"
  exit 1
else
  echo "SUCCESS"
fi