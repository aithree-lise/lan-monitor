# Multi-stage build
FROM node:22-alpine AS build

WORKDIR /app

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend source and build
COPY frontend ./frontend
RUN cd frontend && npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built frontend
COPY --from=build /app/frontend/dist ./dist

# Copy and install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server source
COPY server ./server

# Expose port
EXPOSE 3000

# Set production mode
ENV NODE_ENV=production

# Start server
CMD ["node", "server/index.js"]
