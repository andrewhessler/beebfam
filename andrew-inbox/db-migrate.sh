parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
db="ainbox.db"
service="andrew-inbox"
git pull
cp /var/lib/$service/$db $parent_path/$db
sqlx migrate run
cp $parent_path/$db /var/lib/$service/$db
