FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/package*.json ./

RUN npm ci --omit=dev && chown -R node:node node_modules

COPY --chown=node:node --from=build /usr/src/app/dist ./dist

USER node

EXPOSE 5050

CMD ["node", "dist/main"]