#!/usr/bin/env bash

set -e

echo "------------------------ Starting Test Container ------------------------"
docker run \
    --name test-container \
    --network development \
    --env-file .env.cypress \
    -p "$PORT:$PORT" \
    "$APP_IMAGE"