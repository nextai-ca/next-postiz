#!/bin/bash

# Development build script for local development
# For production builds on different architecture, use docker-build-production.sh

set -o xtrace

docker rmi localhost/postiz || true
docker build --target dist -t localhost/postiz -f Dockerfile.dev .
docker build --target devcontainer -t localhost/postiz-devcontainer -f Dockerfile.dev .
