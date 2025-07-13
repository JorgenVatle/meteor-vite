#!/usr/bin/env bash

set -e

docker run --name test-container -p "$PORT:$PORT" --env-file .env.cypress "$APP_IMAGE"