parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
db="supply.db"
git pull
cp /var/lib/grocery-list/$db $parent_path/$db
sqlx migrate run
cp $parent_path/$db /var/lib/grocery-list/$db
