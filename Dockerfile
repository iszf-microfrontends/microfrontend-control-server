ARG PORT

FROM node:16-alpine3.17 as base

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

FROM node:16-alpine3.17

WORKDIR /app

COPY --from=base /app/dist ./dist

COPY package*.json yarn.lock ./

EXPOSE ${PORT}

CMD ["yarn", "serve"]