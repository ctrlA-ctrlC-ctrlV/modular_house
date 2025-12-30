FROM node:20-alpine AS builder

# Install pnpm
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

# Build
RUN pnpm build

# Production image
FROM node:20-alpine AS runner

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

# API runs on port 8080 by default (see config/env.ts)
EXPOSE 8080

CMD ["node", "dist/server.js"]
