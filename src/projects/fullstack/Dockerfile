#########################
# BUILD STAGE - mainapp #
#########################

FROM oven/bun:alpine AS mainapp

# This env var is only consumed in build.ts
ENV IN_DOCKER_BUILD=true

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY build.ts bunPluginTailwind.ts bunfig.toml ./
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
RUN apk update && apk add --no-cache ca-certificates fuse3 sqlite curl && rm -rf /var/cache/apk/*

# Pull in the litefs binary by copying it from the official Docker image.
COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs

# Copy LiteFS configuration.
COPY litefs.yml /etc/litefs.yml

WORKDIR /app

COPY bunPluginTailwind.ts bunfig.toml /app
COPY --from=mainapp /dist /app/
COPY --from=drizzlestudio /app/drizzleStudio /app/drizzleStudio

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
