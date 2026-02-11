# Multi-stage build
FROM node:22-alpine AS build

WORKDIR /app

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend source and build
COPY frontend ./frontend
RUN cd frontend && npm run build

# Production stage — nvidia/cuda base so nvidia-smi is available at runtime
FROM nvidia/cuda:12.8.0-base-ubuntu22.04

# Install Node.js 22 + build tools for better-sqlite3
RUN apt-get update && apt-get install -y \
    curl iputils-ping python3 make g++ && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-mark hold nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend
COPY --from=build /app/frontend/dist ./dist

# Copy and install server dependencies (includes better-sqlite3 compilation)
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server source
COPY server ./server

# Expose port
EXPOSE 8080

# Set production mode
ENV NODE_ENV=production

# Start server
CMD ["node", "server/index.js"]
