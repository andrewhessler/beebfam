#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $parent_path

git pull

cd $parent_path/src/client

npm ci

npm run build

cd $parent_path 

# Build the project in release mode
echo "Building the project in release mode..."
cargo build --release

# Verify the executable exists
if [ ! -f "$parent_path/target/release/chore-kanban" ]; then
  echo "Error: Executable not found at $parent_path/target/release/chore-kanban"
  echo "Ensure your Cargo.toml specifies the package name correctly"
  exit 1
fi

# Move the executable to /usr/local/bin
echo "Moving executable to /usr/local/bin/chore-kanban"
sudo mv $parent_path/target/release/chore-kanban /usr/local/bin/chore-kanban

# Restart the systemd service
sudo systemctl daemon-reload
echo "Restarting the systemd service 'chore-kanban.service'..."
sudo systemctl restart chore-kanban.service

echo "Build, install, and service restart complete."
