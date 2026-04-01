# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@10.14.0

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.14.0

COPY package.json pnpm-lock.yaml ./

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p uploads

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["npm", "start"]
