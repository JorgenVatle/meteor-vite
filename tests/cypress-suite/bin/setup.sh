#!/usr/bin/env bash

set -e

echo ""
echo ""
echo ""
echo "-------- Pulling docker image: $1 --------"
echo ""
echo ""
echo ""
docker pull $1

echo ""
echo ""
echo ""
echo "-------- Preparing Mongo container --------"
echo ""
echo ""
echo ""
docker network create development
docker run --name mongo -p "$MONGO_PORT:$MONGO_PORT" --network development -d mongo