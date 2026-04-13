#########################
# BUILD STAGE - mainapp #
#########################

FROM oven/bun:alpine AS mainapp

# This env var is only consumed in build.ts
ENV IN_DOCKER_BUILD=true

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY build.ts bunfig.toml ./
COPY src ./src/

RUN NODE_ENV=production bun --bun run ./build.ts

################################
# BUILD STAGE - Drizzle Studio #
################################

FROM oven/bun:alpine AS drizzlestudio

# This env var is only consumed in buildDrizzleStudio.ts
ENV IN_DOCKER_BUILD=true

WORKDIR /app

COPY buildDrizzleStudio.ts ./
COPY src ./src/

# This is so buildDrizzleStudio.ts has the necessary packages installed
# This node_modules & package.json will NOT be copied over into the final image
RUN echo '{}' > package.json && bun install drizzle-kit drizzle-orm

# Ensure the drizzleStudio directory contains node_modules and package.json
# This node_modules & package.json WILL be copied over into the final image
WORKDIR /app/drizzleStudio
RUN echo '{}' > package.json && bun install drizzle-kit drizzle-orm @libsql/client

WORKDIR /app
RUN NODE_ENV=production bun --bun run ./buildDrizzleStudio.ts

COPY src/server/db/drizzleStudio.ts /app/drizzleStudio/

##############
# PROD STAGE #
##############

FROM oven/bun:alpine

# ca-certificates, fuse3, and sqlite are needed for LiteFS to work.
# curl is installed just for convenience.
# vips is required by sharp for image processing
RUN apk add --no-cache ca-certificates fuse3 sqlite curl vips

# Pull in the litefs binary by copying it from the official Docker image.
COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs

# Copy LiteFS configuration.
COPY litefs.yml /etc/litefs.yml

WORKDIR /app

COPY bunfig.toml /app
COPY --from=mainapp /dist /app/
COPY --from=drizzlestudio /app/drizzleStudio /app/drizzleStudio

# Sharp is used to resize/convert avatar uploads to WebP. It has 3 runtime
# dependencies: @img (platform-specific native binary + colour util),
# detect-libc, and semver. Because sharp relies on a native .node addon that
# can't be inlined by a JS bundler, we mark it as external in build.ts and copy
# it with its dependencies from the build stage's node_modules.
COPY --from=mainapp /app/node_modules/sharp /app/node_modules/sharp
COPY --from=mainapp /app/node_modules/@img /app/node_modules/@img
COPY --from=mainapp /app/node_modules/detect-libc /app/node_modules/detect-libc
COPY --from=mainapp /app/node_modules/semver /app/node_modules/semver

# See migrate.ts - drizzle folder expected so DB migrations can be run.
COPY --from=mainapp /app/src/server/db/drizzle /app/drizzle/

ARG PORT=9001

# This is purely for documentation.
EXPOSE ${PORT}

ENV PORT=${PORT}
ENV NODE_ENV=production
ENV SQLITE_PATH=/litefs/{{PROJECT_NAME}}.sqlite
ENV DOMAIN={{PROJECT_NAME}}.com
ENV TZ=America/New_York
ENV START_APP_CMD="bun ./bunServer.js"

# LiteFS requires root to mount the FUSE filesystem, so we can't use a non-root
# user when deploying to Fly.io.
# USER bun => DON'T DO THIS

ENTRYPOINT ["litefs", "mount"]
