parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
db="ainbox.db"
git pull
cp /var/lib/chore-kanban/$db $parent_path/$db
sqlx migrate run
cp $parent_path/$db /var/lib/chore-kanban/$db
