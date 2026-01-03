#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $parent_path

git pull

npm ci

npm run build

sudo rm -r /var/lib/mario-picker/*

echo "Moving dist to /var/lib/mario-picker"
sudo cp -r $parent_path/dist/* /var/lib/mario-picker/

echo "Build, install, and service restart complete."
