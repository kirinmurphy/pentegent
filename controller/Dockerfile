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
COPY controller/ controller/

# Build shared first, then controller
RUN npm run build -w shared && npm run build -w controller

# --- Production stage ---
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY scanner/package.json scanner/
COPY controller/package.json controller/

RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/controller/dist controller/dist

WORKDIR /app/controller

CMD ["node", "dist/index.js"]
