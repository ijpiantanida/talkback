#!/usr/bin/env bash

BASE_URL=https://localhost:8080

error=false

function make_request() {
  status=$(curl -k -o /dev/null -s -w "%{http_code}" "${@:2}")
  if [ "$status" -ne "$1" ]; then
    error=true
    echo "Request "${@:2}" failed with status $status (expected $1)"
  fi
}

# Pertty printed tape
make_request 200 "$BASE_URL/users/ijpiantanida"

# HEAD requests
make_request 200 "$BASE_URL/users/ijpiantanida" -I

# tape's latency
make_request 200 "$BASE_URL/users/slow"

# responseDecorator
make_request 200 "$BASE_URL/auth" -H "content-type: application/json" -d '{"username": "james", "password": "moriarty"}'

# urlMatcher
make_request 200 "$BASE_URL/orgs/test"

# bodyMatcher
make_request 200 "$BASE_URL/users" -H "content-type: application/json" -d '{"username": "james", "ignore": "abc"}'

# Non-200 tape
make_request 400 "$BASE_URL/repos/not-valid"

# Not pretty body printed
make_request 200 "$BASE_URL/repos/ijpiantanida/talkback"

# Fails because of tape's errorRate
make_request 503 "$BASE_URL/users/errorRate"

# Removed by requestDecorator
make_request 200 "$BASE_URL/users/ijpiantanida" -H "accept-encoding: gzip, deflate, br, test"

# Compressed with supported algorithm and saved as plain text
make_request 200 "$BASE_URL/users/ijpiantanida" -H "accept-encoding: gzip, deflate, br"

# Compressed with supported algorithm but saved as base64
make_request 200 "$BASE_URL/users/ijpiantanida" -H "accept-encoding: gzip"

if [ "$error" = true ]; then
  echo "FAILED"
else
  echo "SUCCESS"
fi