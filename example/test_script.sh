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

make_request 200 "$BASE_URL/users/ijpiantanida"

make_request 200 "$BASE_URL/users/ijpiantanida" -I

make_request 200 "$BASE_URL/users/slow"

make_request 200 "$BASE_URL/auth" -H "content-type: application/json" -d '{"username": "james", "password": "moriarty"}'

make_request 200 "$BASE_URL/orgs/test"

make_request 200 "$BASE_URL/users" -H "content-type: application/json" -d '{"username": "james", "ignore": "abc"}'

make_request 400 "$BASE_URL/repos/not-valid"

make_request 200 "$BASE_URL/repos/ijpiantanida/talkback"

make_request 503 "$BASE_URL/users/errorRate"

if [ "$error" = true ]; then
  echo "FAILED"
else
  echo "SUCCESS"
fi