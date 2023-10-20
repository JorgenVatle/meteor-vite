#!/usr/bin/env bash

this="$0"
action="$1" # e.g. link, build, start
app="$2" # e.g. vue, svelte


APP_DIR="$PWD/examples/$app"
BUILD_TARGET="$PWD/examples/output/$app"
NPM_LINK_TARGET="$PWD/npm-packages/meteor-vite"
export METEOR_PACKAGE_DIRS="$PWD/packages"
export METEOR_VITE_TSUP_BUILD_WATCHER="true"


# Start a development server
start() {
  cd "$APP_DIR" || exit 1
  meteor npm start
}

# Install dependencies for dev app
install() {
  cd "$APP_DIR" || exit 1
  meteor npm i
}

# Build an example app for production
build() {
    (link) || exit 1
    (cleanOutput) || exit 1

    ## Disable file watcher for meteor-vite npm package to prevent builds from hanging indefinitely
    METEOR_VITE_TSUP_BUILD_WATCHER="false"

    cd "$APP_DIR" || exit 1
    meteor build "$BUILD_TARGET" --directory
}

# Build then start a production app
launch() {
  (build) || exit 1
  chmod +w -R "$BUILD_TARGET" # Allow writes to the build, very handy for tinkering with the builds

  start:production
}

# Start an already built production app
start:production() {
  (production:install) || exit 1

  local PRODUCTION_SERVER="$this production:app $app"
  local MONGO_SERVER="$this production:mongo $app"

  concurrently --names "PROD,DEV" --prefixColors "cyan,dim" "$PRODUCTION_SERVER" "$MONGO_SERVER"
}

cleanOutput() {
  rm -rf "$BUILD_TARGET"
}

link() {
  cd "$APP_DIR" || exit 1
  meteor npm link "$NPM_LINK_TARGET"
}

production:install() {
   cd "$BUILD_TARGET/bundle/programs/server" || exit 1
   meteor npm install
}

production:mongo() {
  start # Just using the meteor dev server for it's reusable mongo server
}

production:app() {
  cd "$BUILD_TARGET/bundle" || exit 1;

  export PORT=4040
  export ROOT_URL=http://localhost:4040
  export MONGO_URL=mongodb://127.0.0.1:3001/meteor

  meteor node main.js
}

set -x
"$action" || exit 1;