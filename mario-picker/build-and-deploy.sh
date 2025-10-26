#!/bin/bash
set -e

git pull

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $parent_path

npm install

npm run build

sudo rm /var/lib/mario-picker/*

echo "Moving dist to /var/lib/mario-picker"
sudo cp $parent_path/dist/* /var/lib/mario-picker/

echo "Build, install, and service restart complete."
