ARG PORT

FROM node:16-alpine3.17 as base

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

FROM node:16-alpine3.17

WORKDIR /app

COPY --from=base /app/dist ./dist

COPY package*.json pnpm-lock.yaml ./

EXPOSE ${PORT}

CMD ["pnpm", "serve"]