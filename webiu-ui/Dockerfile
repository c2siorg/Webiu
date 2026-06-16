# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from the build stage to Nginx directory
COPY --from=build /usr/src/app/dist/webiu/browser /usr/share/nginx/html

EXPOSE 4000

CMD ["nginx", "-g", "daemon off;"]