FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/web

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG GENERATE_SOURCEMAP
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP

RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
