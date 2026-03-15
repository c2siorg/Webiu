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
COPY package*.json ./
RUN npm ci --only=production

# Copy the built output from the build stage
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 5050
# Start the compiled application directly
CMD ["node", "dist/main.js"]
