#!/bin/bash
set -e

CONTAINER_NAME="lan-monitor"
IMAGE_NAME="lan-monitor"
PORT=8080

echo "🚀 LAN Monitor Deployment Script"
echo "================================================"

# 1. Determine version
if [ -n "$1" ]; then
  VERSION="$1"
  echo "📦 Using provided version: ${VERSION}"
else
  VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "1.0.0-$(git rev-parse --short HEAD)")
  echo "📦 Auto-detected version: ${VERSION}"
fi

COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "   Commit: ${COMMIT}"
echo "   Build Time: ${BUILD_TIME}"
echo ""

# 2. Stop old container
echo "🛑 Stopping old container..."
docker rm -f ${CONTAINER_NAME} 2>/dev/null && echo "   Old container removed" || echo "   No running container"
echo ""

# 3. Build new image
echo "🔨 Building new image..."
docker build \
  --build-arg VERSION="${VERSION}" \
  --build-arg COMMIT="${COMMIT}" \
  --build-arg BUILD_TIME="${BUILD_TIME}" \
  -t ${IMAGE_NAME}:${VERSION} \
  -t ${IMAGE_NAME}:latest \
  .

echo "   Image built: ${IMAGE_NAME}:${VERSION}"
echo ""

# 4. Start new container
echo "🚢 Starting new container..."
docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  --runtime=nvidia \
  -p ${PORT}:${PORT} \
  -v lan-monitor-data:/app/data \
  ${IMAGE_NAME}:${VERSION}

echo "   Container started"
echo ""

# 5. Healthcheck
echo "🏥 Running healthcheck..."
sleep 5

for i in 1 2 3 4 5 6; do
  if curl -sf http://localhost:${PORT}/api/version > /dev/null 2>&1; then
    echo "   Healthcheck passed!"
    echo ""
    echo "📊 Deployed Version:"
    curl -s http://localhost:${PORT}/api/version 2>/dev/null | python3 -m json.tool 2>/dev/null || curl -s http://localhost:${PORT}/api/version
    echo ""
    echo "🎉 Deployment successful!"
    echo "   Dashboard: http://localhost:${PORT}"
    exit 0
  fi
  echo "   Attempt $i/6 failed, retrying in 5s..."
  sleep 5
done

echo "❌ Healthcheck failed after 30s!"
echo "📋 Container logs:"
docker logs --tail 20 ${CONTAINER_NAME}
echo ""
echo "💡 Rollback: docker rm -f ${CONTAINER_NAME} && docker run -d --name ${CONTAINER_NAME} --runtime=nvidia -p ${PORT}:${PORT} -v lan-monitor-data:/app/data ${IMAGE_NAME}:<previous-version>"
exit 1
