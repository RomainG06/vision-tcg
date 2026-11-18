# Multi-stage build pour backend
FROM node:20-slim AS base

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Production stage
FROM node:20-slim AS production
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000
USER node
CMD ["node", "src/api/server.js"]
