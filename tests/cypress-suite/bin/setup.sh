#!/usr/bin/env bash

set -e

echo "------------------------ Pulling docker image: $1 ------------------------"
docker pull $1

echo "------------------------ Preparing Mongo container ------------------------"
docker network create development
docker run --name mongo -p "$MONGO_PORT:$MONGO_PORT" --network development -d mongo