parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
git pull
cp /var/lib/chore-kanban/chore.db $parent_path/chore.db
sqlx migrate run
cp $parent_path/chore.db /var/lib/chore-kanban/chore.db
