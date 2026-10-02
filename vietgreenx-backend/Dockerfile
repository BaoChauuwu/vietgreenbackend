# ── Base ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ── Dependencies ──────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ── Development (hot reload) ──────────────────────────────────────────────
FROM base AS development
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
EXPOSE 9000
CMD ["dumb-init", "npm", "run", "start:dev"]

# ── Build ─────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 9000
CMD ["dumb-init", "node", "dist/main.js"]
