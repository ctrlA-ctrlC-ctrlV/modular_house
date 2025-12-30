FROM node:20-slim AS builder

# Install pnpm and OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages (needed if there are workspace dependencies)
COPY packages ./packages

# Copy app source
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm db:generate

# Build TypeScript
RUN pnpm build

# Verify build output exists
RUN if [ ! -f dist/server.js ]; then \
      echo "ERROR: Build failed - dist/server.js not found!" && \
      echo "Contents of apps/api:" && ls -la && \
      echo "Contents of dist (if exists):" && ls -la dist 2>/dev/null || echo "dist folder does not exist" && \
      exit 1; \
    fi && \
    echo "Build successful - dist/server.js exists"

# Production image
FROM node:20-slim AS runner

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files for runtime
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
# Copy local node_modules if they exist (Prisma client often lives here or in root)
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /app/apps/api

# Verify dist was copied correctly
RUN if [ ! -f dist/server.js ]; then \
      echo "ERROR: dist/server.js not found in runner stage!" && \
      echo "Contents of /app/apps/api:" && ls -la && \
      echo "Contents of dist (if exists):" && ls -la dist 2>/dev/null || echo "dist folder missing" && \
      exit 1; \
    fi && \
    echo "Runner stage: dist/server.js verified"

# API runs on port 8080 by default (see config/env.ts)
EXPOSE 8080

CMD ["node", "dist/server.js"]
