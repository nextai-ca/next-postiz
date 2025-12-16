#!/bin/bash

# Production build script for AMD64/x86_64 platform
# This script builds Docker images for production deployment on x86_64 servers (e.g., AWS EC2)
# Usage: ./docker-build-production.sh <image-name> [Dockerfile]

set -o xtrace

IMAGE_NAME=${1:-"localhost/postiz"}
DOCKERFILE=${2:-"Dockerfile.dev"}

echo "Building production image for linux/amd64 platform..."
echo "Image name: $IMAGE_NAME"
echo "Dockerfile: $DOCKERFILE"

# Check if buildx is available
if ! docker buildx version > /dev/null 2>&1; then
  echo "Error: docker buildx is not available. Please update Docker Desktop or install buildx."
  exit 1
fi

# Use default builder if no custom builder exists
docker buildx use default 2>/dev/null || docker buildx create --name default --use

# Remove existing image if it exists (only if it's a local image)
if [[ "$IMAGE_NAME" != *".dkr.ecr."* ]] && [[ "$IMAGE_NAME" != *".amazonaws.com"* ]]; then
  docker rmi "$IMAGE_NAME" || true
fi

# Build for linux/amd64 platform (compatible with AWS EC2, most cloud servers)
echo "Starting build for linux/amd64..."
docker buildx build \
  --platform linux/amd64 \
  -f "$DOCKERFILE" \
  -t "$IMAGE_NAME" \
  --load \
  .

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build complete! Image: $IMAGE_NAME"
  echo ""
  echo "To verify platform:"
  echo "  docker image inspect $IMAGE_NAME | grep Architecture"
  echo ""
  
  if [[ "$IMAGE_NAME" == *".dkr.ecr."* ]] || [[ "$IMAGE_NAME" == *".amazonaws.com"* ]]; then
    echo "To push to AWS ECR:"
    echo "  docker push $IMAGE_NAME"
  else
    echo "To push to AWS ECR:"
    echo "  # Login first:"
    echo "  aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com"
    echo "  # Tag and push:"
    echo "  docker tag $IMAGE_NAME <account>.dkr.ecr.<region>.amazonaws.com/<repository>:<tag>"
    echo "  docker push <account>.dkr.ecr.<region>.amazonaws.com/<repository>:<tag>"
  fi
else
  echo "❌ Build failed!"
  exit 1
fi

