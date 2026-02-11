FROM node:20-slim AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy workspace package.json files
COPY shared/package.json shared/
COPY scanner/package.json scanner/
COPY controller/package.json controller/

RUN npm ci

# Copy source
COPY shared/ shared/
COPY scanner/ scanner/

# Build shared first, then scanner
RUN npm run build -w shared && npm run build -w scanner

# --- Production stage ---
FROM node:20-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY scanner/package.json scanner/
COPY controller/package.json controller/

RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/scanner/dist scanner/dist

WORKDIR /app/scanner

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
