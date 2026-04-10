# --- Build stage ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# --- Runtime stage ---
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist .

ARG PORT=3000

# This is purely for documentation.
EXPOSE ${PORT}
ENV PORT=${PORT}
ENV NODE_ENV=production

# Use a non-root user
USER bun

CMD ["bun", "run", "./bunServer.js"]
