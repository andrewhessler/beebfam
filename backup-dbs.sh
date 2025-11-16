#!/bin/bash
backup_dir="$HOME/db-backups"
mkdir -p "$backup_dir"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Starting database backups ==="
echo "Backup directory: $backup_dir"
echo ""

backup_count=0

for dir in "$script_dir"/*/; do
    if [ -f "${dir}db-migrate.sh" ]; then
        db=$(grep '^db=' "${dir}db-migrate.sh" | cut -d'"' -f2)
        service=$(grep '^service=' "${dir}db-migrate.sh" | cut -d'"' -f2)
        
        if [ -n "$db" ] && [ -n "$service" ]; then
            source_db="/var/lib/$service/$db"
            backup_file="$backup_dir/${service}_$(date +%Y%m%d_%H%M%S).db"
            
            # Check if source database exists
            if [ -f "$source_db" ]; then
                echo "Backing up $service..."
                echo "Source: $source_db"
                echo "Destination: $backup_file"
                
                # Use sqlite3 .backup command
                if sqlite3 "$source_db" ".backup '$backup_file'"; then
                    echo "Backup successful"
                    ((backup_count++))
                else
                    echo "Backup failed"
                fi
            else
                echo "Skipping $service - database not found: $source_db"
            fi
            echo ""
        fi
    fi
done

echo "Backup complete. $backup_count database(s) backed up."
