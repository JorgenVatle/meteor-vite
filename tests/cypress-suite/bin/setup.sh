#!/usr/bin/env bash

set -e

echo "Pulling docker image: $1"
docker pull $1