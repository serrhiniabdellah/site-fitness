#!/bin/bash

echo "Waiting for MySQL to be ready..."
# Wait for MySQL to be ready
while ! mysqladmin ping -h"localhost" --silent; do
    sleep 1
done

echo "MySQL is ready, importing schema..."

# Check if the database already has tables
TABLES_COUNT=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(TABLE_NAME) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'fitzone_db';" | grep -v "COUNT")

if [ "$TABLES_COUNT" -gt "0" ]; then
    echo "Database already has $TABLES_COUNT tables, skipping import."
else
    echo "Database appears empty, importing schema..."
    # Run the full schema import
    mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" fitzone_db < /docker-entrypoint-initdb.d/fitzone_db.sql
    
    if [ $? -eq 0 ]; then
        echo "Schema imported successfully."
    else
        echo "Error importing schema!"
        # Try with root user as fallback
        echo "Trying with root user..."
        mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" fitzone_db < /docker-entrypoint-initdb.d/fitzone_db.sql
        
        if [ $? -eq 0 ]; then
            echo "Schema imported successfully with root user."
        else
            echo "Failed to import schema with root user."
            exit 1
        fi
    fi
fi

echo "Database initialization complete!"