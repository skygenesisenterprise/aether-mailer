#!/bin/sh
# Multi-architecture build script for Aether Mailer
# Builds Docker images for AMD64, ARM64, and RISC-V

set -e

# Configuration
VERSION=${1:-latest}
REGISTRY="skygenesisenterprise/aether-mailer"
PLATFORMS="linux/amd64,linux/arm64,linux/riscv64"
BUILDER_NAME="aether-mailer-builder"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}🔨 Building Aether Mailer Docker images${NC}"
echo "=================================="
echo "Version: ${YELLOW}$VERSION${NC}"
echo "Platforms: ${YELLOW}$PLATFORMS${NC}"
echo ""

# Create builder if not exists
echo "${BLUE}🏗️  Setting up buildx builder...${NC}"
docker buildx create --name $BUILDER_NAME --use 2>/dev/null || {
    echo "${GREEN}✓ Builder already exists${NC}"
}

# Build main image
echo ""
echo "${BLUE}🐳 Building main image...${NC}"
docker buildx build \
    --builder $BUILDER_NAME \
    --platform $PLATFORMS \
    --tag $REGISTRY:$VERSION \
    --tag $REGISTRY:latest \
    --push \
    .

echo ""
echo "${GREEN}✅ Main image build completed${NC}"

# Build rootless variant (if Dockerfile exists)
if [ -f "docker/manifests/Dockerfile.rootless" ]; then
    echo ""
    echo "${BLUE}🐳 Building rootless variant...${NC}"
    docker buildx build \
        --builder $BUILDER_NAME \
        --platform $PLATFORMS \
        --tag $REGISTRY:$VERSION-rootless \
        --tag $REGISTRY:latest-rootless \
        --push \
        -f docker/manifests/Dockerfile.rootless \
        .
    
    echo "${GREEN}✅ Rootless image build completed${NC}"
fi

# Create and push multi-architecture manifest
echo ""
echo "${BLUE}📦 Creating multi-architecture manifest...${NC}"
docker manifest create $REGISTRY:latest \
    $REGISTRY:latest-amd64 \
    $REGISTRY:latest-arm64 \
    $REGISTRY:latest-riscv64

docker manifest push $REGISTRY:latest

echo ""
echo "${GREEN}🎉 Build process completed successfully!${NC}"
echo ""
echo "${BLUE}📋 Available images:${NC}"
echo "  $REGISTRY:latest"
echo "  $REGISTRY:$VERSION"
if [ -f "docker/manifests/Dockerfile.rootless" ]; then
    echo "  $REGISTRY:latest-rootless"
    echo "  $REGISTRY:$VERSION-rootless"
fi