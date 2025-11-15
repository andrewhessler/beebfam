parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
db="exercise.db"
service="exercise-tracker"
git pull
cp /var/lib/$service/$db $parent_path/$db
sqlx migrate run
cp $parent_path/$db /var/lib/$service/$db
