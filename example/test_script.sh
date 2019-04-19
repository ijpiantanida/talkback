#!/usr/bin/env bash

BASE_URL=https://localhost:8080

error=false

function make_request() {
  status=$(curl -k -o /dev/null -s -w "%{http_code}" "${@:1}")
  if [ "$status" -eq "404" ]; then
    error=true
    echo "Request "${@:1}" could not be made"
  fi
}

make_request "$BASE_URL/users/ijpiantanida"

make_request "$BASE_URL/users/ijpiantanida" -I

make_request "$BASE_URL/users/slow"

make_request "$BASE_URL/auth" -H "content-type: application/json" -d '{"username": "james", "password": "moriarty"}'

make_request "$BASE_URL/orgs/test"

make_request "$BASE_URL/users" -H "content-type: application/json" -d '{"username": "james", "ignore": "abc"}'

make_request "$BASE_URL/repos/not-valid"

make_request "$BASE_URL/repos/ijpiantanida/talkback"

if [ "$error" = true ]; then
  echo "FAILED"
else
  echo "SUCCESS"
fi