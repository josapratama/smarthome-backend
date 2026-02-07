# syntax=docker/dockerfile:1
FROM oven/bun:latest

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json bun.lockb* ./
RUN bun install

# Prisma (client generation)
COPY prisma ./prisma
RUN bun run prisma:generate

# Tailwind (build CSS for landing page)
COPY tailwind.config.cjs postcss.config.cjs ./
COPY web ./web
COPY public ./public
RUN bun run tailwind:build

# App source
COPY tsconfig.json ./
COPY src ./src
COPY docs ./docs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]
