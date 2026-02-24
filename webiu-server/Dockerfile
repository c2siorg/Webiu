FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./

RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 5050

CMD ["node", "dist/main"]
