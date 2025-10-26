git pull
cp /var/lib/chore-kanban/chore.db ./
sqlx migrate run
cp ./chore.db /var/lib/chore-kanban/
