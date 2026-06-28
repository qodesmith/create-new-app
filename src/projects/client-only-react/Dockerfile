# --- Build stage ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN NODE_ENV=production bun --bun run build.ts

# --- Runtime stage ---
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist .

ARG PORT=9001

# This is purely for documentation.
EXPOSE ${PORT}
ENV PORT=${PORT}
ENV NODE_ENV=production

# Use a non-root user
USER bun

CMD ["bun", "run", "./bunServer.js"]
