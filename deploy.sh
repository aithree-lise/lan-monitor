#!/bin/bash
set -e

# Colors for output
RED='\''\033[0;31m'\''
GREEN='\''\033[0;32m'\''
YELLOW='\''\033[1;33m'\''
NC='\''\033[0m'\'' # No Color

# Default values
CONTAINER_NAME="lan-monitor"
IMAGE_NAME="lan-monitor"
PORT=8080

echo -e "${GREEN}🚀 LAN Monitor Deployment Script${NC}"
echo "================================================"

# 1. Determine version (Git tag or parameter)
if [ -n "$1" ]; then
  VERSION="$1"
  echo -e "${YELLOW}📦 Using provided version: ${VERSION}${NC}"
else
  VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "1.0.0-$(git rev-parse --short HEAD)")
  echo -e "${YELLOW}📦 Auto-detected version: ${VERSION}${NC}"
fi

COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "   Commit: ${COMMIT}"
echo "   Build Time: ${BUILD_TIME}"
echo ""

# 2. Stop old container (if running)
echo -e "${YELLOW}🛑 Stopping old container...${NC}"
if docker ps -q --filter "name=${CONTAINER_NAME}" | grep -q .; then
  docker stop ${CONTAINER_NAME} || true
  docker rm ${CONTAINER_NAME} || true
  echo -e "${GREEN}   ✅ Old container stopped${NC}"
else
  echo "   No running container found"
fi
echo ""

# 3. Build new image with version metadata
echo -e "${YELLOW}🔨 Building new image...${NC}"
docker build \
  --build-arg VERSION="${VERSION}" \
  --build-arg COMMIT="${COMMIT}" \
  --build-arg BUILD_TIME="${BUILD_TIME}" \
  -t ${IMAGE_NAME}:${VERSION} \
  -t ${IMAGE_NAME}:latest \
  .

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi
echo -e "${GREEN}   ✅ Image built: ${IMAGE_NAME}:${VERSION}${NC}"
echo ""

# 4. Start new container
echo -e "${YELLOW}🚢 Starting new container...${NC}"
docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p ${PORT}:${PORT} \
  --runtime=nvidia \
  -v lan-monitor-data:/app/data \
  ${IMAGE_NAME}:${VERSION}

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Container start failed!${NC}"
  echo -e "${YELLOW}💡 Rollback hint: docker run ... ${IMAGE_NAME}:<previous-version>${NC}"
  exit 1
fi
echo -e "${GREEN}   ✅ Container started${NC}"
echo ""

# 5. Healthcheck
echo -e "${YELLOW}🏥 Running healthcheck...${NC}"
sleep 5  # Give the server time to start

for i in {1..6}; do
  if curl -sf http://localhost:${PORT}/api/version > /dev/null; then
    echo -e "${GREEN}   ✅ Healthcheck passed!${NC}"
    echo ""
    
    # Show version info
    echo -e "${GREEN}📊 Deployed Version Info:${NC}"
    curl -s http://localhost:${PORT}/api/version | python3 -m json.tool || curl -s http://localhost:${PORT}/api/version
    echo ""
    
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo "   Dashboard: http://localhost:${PORT}"
    exit 0
  fi
  
  echo "   Attempt $i/6 failed, retrying in 5s..."
  sleep 5
done

# Healthcheck failed
echo -e "${RED}❌ Healthcheck failed after 30s!${NC}"
echo -e "${YELLOW}📋 Container logs:${NC}"
docker logs --tail 20 ${CONTAINER_NAME}
echo ""
echo -e "${YELLOW}💡 Rollback instructions:${NC}"
echo "   1. docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}"
echo "   2. docker run -d --name ${CONTAINER_NAME} --restart unless-stopped -p ${PORT}:${PORT} --runtime=nvidia -v lan-monitor-data:/app/data ${IMAGE_NAME}:<previous-version>"
exit 1
