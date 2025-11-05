#!/bin/bash

# Build and deploy all immediate subdirectories that contain build-and-deploy.sh

set -e 

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in "$ROOT_DIR"/*/; do
    # Remove trailing slash and get directory name
    dir_name=$(basename "$dir")
    
    if [ -f "$dir/build-and-deploy.sh" ]; then
        cd "$dir"
        ./build-and-deploy.sh
    fi
done
