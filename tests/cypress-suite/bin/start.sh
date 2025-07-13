#!/usr/bin/env bash

set -e

echo ""
echo ""
echo ""
echo "------------------------ Starting Test Container ------------------------"
echo ""
echo ""
echo ""
docker run \
    --name test-container \
    --network development \
    --env-file .env.cypress \
    -p "$PORT:$PORT" \
    "$APP_IMAGE"