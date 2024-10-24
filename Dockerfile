# Node.js Version to run our production server.
# This needs to match as what's expected by our current meteor release;
# https://docs.meteor.com/changelog.html
ARG NODE_VERSION="20-alpine"

# Meteor release (Needs to match the release in .meteor/release)
ARG METEOR_RELEASE="3.0-rc.2"

# Meteor base image name
ARG METEOR_BASE_IMAGE="jorgenvatle/meteor-base"

# Path relative to the repository root to the Meteor app to build
# Ex: ./examples/vue
ARG APP_BASENAME

# Node.js production runtime
# This is the smallest possible image we can use to run the pre-built Meteor bundle.
FROM node:$NODE_VERSION AS nodejs-runtime
ENV APP_BUNDLE_FOLDER=/opt/bundle
ENV SCRIPTS_FOLDER=/docker
ARG APP_BASENAME
ENV APP_BASENAME=$APP_BASENAME

# Runtime dependencies; (For node-sass, bcrypt etc.)
RUN apk --no-cache add \
		bash \
		ca-certificates \
		python3 \
		make \
		g++ \
        gettext

# Meteor.js Base Image
# Has `meteor` installed for building the production server as well as running any
# development/testing environments if that's more convenient to use.
FROM $METEOR_BASE_IMAGE:$METEOR_RELEASE AS meteor-base
ARG APP_BASENAME
RUN test -n "$APP_BASENAME"

ENV APP_BASENAME=$APP_BASENAME
ENV APP_DIR=./examples/$APP_BASENAME
ENV METEOR_PACKAGES_FOLDER=/root/packages
ENV NPM_PACKAGES_FOLDER=/root/npm-packages
ENV METEOR_PACKAGE_DIRS=$METEOR_PACKAGES_FOLDER

COPY ./packages $METEOR_PACKAGES_FOLDER
COPY ./npm-packages $NPM_PACKAGES_FOLDER
COPY ./test-packages/atmosphere/ $METEOR_PACKAGES_FOLDER/
COPY ./package*.json /root

# Prepare meteor-vite package for local reference when preparing npm dependencies.
RUN cd $NPM_PACKAGES_FOLDER/meteor-vite && meteor npm ci && meteor npm link

WORKDIR $APP_SOURCE_FOLDER

# Meteor.js base image with pre-built npm and atmosphere dependencies
FROM meteor-base AS meteor-bundler

# Install local and external npm dependencies
COPY $APP_DIR/package*.json $APP_SOURCE_FOLDER/
RUN bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh
RUN meteor npm link meteor-vite

# Build for production
COPY $APP_DIR $APP_SOURCE_FOLDER/
RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh

# Meteor Production Server
# This is what we ship to production.
FROM nodejs-runtime AS production-server

# Import entrypoint script and production bundle
COPY --from=meteor-bundler $SCRIPTS_FOLDER $SCRIPTS_FOLDER/
COPY --from=meteor-bundler $APP_BUNDLE_FOLDER $APP_BUNDLE_FOLDER/

# Install production npm dependencies
RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh

COPY .docker/scripts $SCRIPTS_FOLDER/custom

# Start app
ENTRYPOINT ["/docker/custom/entrypoint.sh"]
CMD ["node", "main.js"]