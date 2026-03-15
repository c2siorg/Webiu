# Stage 1: Build the backend application
FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Copy package files and install ALL dependencies (including dev for building)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy package files and install ONLY production dependencies
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
RUN npm ci --only=production && chown -R node:node node_modules

# Copy the built output from the build stage
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

USER node
EXPOSE 5050

# Start the compiled application directly
CMD ["node", "dist/main.js"]
