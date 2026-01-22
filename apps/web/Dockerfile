FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

# Build dependencies first
RUN pnpm --filter @modular-house/ui build

WORKDIR /app/apps/web

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_GA_TRACKING_ID
ENV VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID

ARG GENERATE_SOURCEMAP
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP

RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist/client /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
