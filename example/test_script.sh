#!/usr/bin/env bash

BASE_URL=http://localhost:8080

curl "$BASE_URL/users/ijpiantanida"

curl "$BASE_URL/users/ijpiantanida" -I

curl "$BASE_URL/auth" -H "content-type: application/json" -d '{"username": "james", "password": "moriarty"}'

curl "$BASE_URL/orgs/test"

curl "$BASE_URL/users" -H "content-type: application/json" -d '{"username": "james", "ignore": "abc"}'

curl "$BASE_URL/repos/not-valid"

curl "$BASE_URL/repos/ijpiantanida/talkback"