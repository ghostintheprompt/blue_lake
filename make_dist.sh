#!/bin/bash

# Blue Lake Build Script
# Packages the application into a distribution-ready ZIP.

VERSION="1.0.0"
DIST_NAME="blue-lake-v${VERSION}"

echo "[SYS] Initializing build for ${DIST_NAME}..."

# Clean previous builds
rm -rf dist
rm -f ${DIST_NAME}.zip

# Build frontend
npm run build

# Prepare release directory
mkdir -p ${DIST_NAME}
cp -r dist ${DIST_NAME}/
cp server.ts ${DIST_NAME}/
cp package.json ${DIST_NAME}/
cp README.md ${DIST_NAME}/
cp LICENSE ${DIST_NAME}/
cp -r public ${DIST_NAME}/

# Create ZIP
zip -r ${DIST_NAME}.zip ${DIST_NAME}

# Clean up
rm -rf ${DIST_NAME}

echo "[SYS] Build complete: ${DIST_NAME}.zip"
