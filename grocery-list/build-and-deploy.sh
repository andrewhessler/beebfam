#!/bin/bash
set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
service="grocery-list"

cd $parent_path

git pull

cd $parent_path/src/client

npm install

npm run build

cd $parent_path 

# Build the project in release mode
echo "Building the project in release mode..."
cargo build --release

# Verify the executable exists
if [ ! -f "$parent_path/target/release/$service" ]; then
  echo "Error: Executable not found at $parent_path/target/release/$service"
  echo "Ensure your Cargo.toml specifies the package name correctly"
  exit 1
fi

# Move the executable to /usr/local/bin
echo "Moving executable to /usr/local/bin/$service"
sudo mv $parent_path/target/release/$service /usr/local/bin/$service

# Restart the systemd service
sudo systemctl daemon-reload
echo "Restarting the systemd service '$service.service'..."
sudo systemctl restart $service.service

echo "Build, install, and service restart complete."
