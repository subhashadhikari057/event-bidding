FROM node:24.18.0-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build
RUN npm prune --omit=dev

FROM node:24.18.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
