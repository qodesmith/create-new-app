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
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "./devServer.js"]
