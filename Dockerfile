FROM oven/bun:latest
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY prisma.config.ts ./
COPY prisma ./prisma
RUN bun run prisma:generate

# copy source sekali saja
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
COPY tailwind.config.js ./
RUN bun run tailwind:build

COPY docs ./docs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "start"]
