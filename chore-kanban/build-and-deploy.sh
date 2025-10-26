#!/bin/bash
set -e

git pull

cd src/client

npm install

npm run build

cd ../..

# Build the project in release mode
echo "Building the project in release mode..."
cargo build --release

# Verify the executable exists
if [ ! -f "target/release/chore-kanban" ]; then
  echo "Error: Executable not found at target/release/chore-kanban"
  echo "Ensure your Cargo.toml specifies the package name correctly"
  exit 1
fi

# Move the executable to /usr/local/bin (sudo may be required)
echo "Moving executable to /usr/local/bin/chore-kanban"
sudo mv target/release/chore-kanban /usr/local/bin/chore-kanban

# Restart the systemd service
sudo systemctl daemon-reload
echo "Restarting the systemd service 'chore-kanban.service'..."
sudo systemctl restart chore-kanban.service

echo "Build, install, and service restart complete."
