#!/usr/bin/env bash

ENDCOLOR="\e[0m"
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"

color=""

titleLog() {
  set +x
  local title="$1"
  local content="${@:2}"
  echo -e "${color}

  [--  $title  --]
  L $content
$ENDCOLOR"
  set -x
}

log:success() {
  color="$GREEN"
  titleLog Success "$@"
}