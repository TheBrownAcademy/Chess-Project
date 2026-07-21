# ── Stage 1: Build ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema first so we can generate the client
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma client (outputs to src/generated/prisma)
RUN npx prisma generate

# Copy the rest of the source code and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema (needed at runtime for migrations / prisma client resolution)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy the compiled output and the generated Prisma client from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

# Re-generate Prisma client in production stage so native binaries match this OS
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/index.js"]
