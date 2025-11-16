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
            
            if [ -f "$source_db" ]; then
                echo "Backing up $service..."
                echo "Source: $source_db"
                echo "Destination: $backup_file"
                
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
echo ""

if [ $backup_count -gt 0 ]; then
    cd "$backup_dir" || exit 1
    
    git add *.db
    
    commit_date=$(date +"%Y-%m-%d %H:%M:%S")
    git commit -m "$commit_date Backup"
    
    git push origin main
else
    echo "No backups created, skipping git operations."
fi
