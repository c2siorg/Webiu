FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/package*.json ./

RUN npm install --omit=dev && chown -R node:node node_modules

COPY --chown=node:node --from=build /usr/src/app/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/webiu/server/server.mjs"]