ARG PORT

FROM node:16.20.0-alpine3.16 as builder

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

FROM node:16.20.0-alpine3.16 as runner

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY package*.json yarn.lock ./

EXPOSE ${PORT}

CMD ["yarn", "serve"]