# Stage 1: Build the Angular application
FROM node:18-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the built files from the build stage
# Assuming Angular 17+ outputs to dist/webiu/browser (standard for standalone)
COPY --from=build /usr/src/app/dist/webiu/browser /usr/share/nginx/html
# Copy custom nginx config to support Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
