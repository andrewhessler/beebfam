#!/bin/bash
set -e

git pull

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $parent_path


sudo rm /var/lib/beebfam/*

echo "Moving dist to /var/lib/beebfam"
sudo cp $parent_path/index.css /var/lib/beebfam/index.css
sudo cp $parent_path/index.html /var/lib/beebfam/index.html

echo "Build, install, and service restart complete."
