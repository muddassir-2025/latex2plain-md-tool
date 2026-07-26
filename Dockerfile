# ─── Build stage: compile TypeScript & build React frontend ────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Prevent Puppeteer from downloading Chromium during npm ci —
# we use the system-installed Chromium in the production stage
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy root package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy client package files
COPY client/package.json ./client/
RUN cd client && npm install

# Copy source code
COPY tsconfig.json ./
COPY src/ src/
COPY client/ client/

# Build server TypeScript
RUN npm run build

# Build React frontend
RUN cd client && npm run build

# Remove devDependencies — only production deps needed at runtime
RUN npm prune --omit=dev

# ─── Production stage ────────────────────────────────────────────────────
FROM node:22-slim

WORKDIR /app

# Install Chromium for Puppeteer PDF generation
# node:22-slim is Debian 12 Bookworm — chromium is available in the default repos
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to the system-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/client/dist /app/client/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

EXPOSE 3001

CMD ["node", "dist/server.js"]
