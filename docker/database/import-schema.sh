#!/bin/bash

echo "===== FitZone Database Initialization ====="

# Make sure the script is executable
chmod +x /docker-entrypoint-initdb.d/import-schema.sh

# Wait for MySQL to be ready
echo "Waiting for MySQL to be fully initialized..."
for i in {1..30}; do
    if mysqladmin ping -h"localhost" --silent; then
        echo "MySQL is ready"
        break
    fi
    echo "Waiting for MySQL to be ready (attempt $i/30)..."
    sleep 2
done

# Ensure schema file exists and is readable
if [ ! -f /docker-entrypoint-initdb.d/fitzone_db.sql ]; then
    echo "ERROR: Database schema file not found at /docker-entrypoint-initdb.d/fitzone_db.sql"
    exit 1
fi

echo "Database schema file found and readable"

# Check if the database already has tables
TABLES_COUNT=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(TABLE_NAME) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$MYSQL_DATABASE';" | grep -v "COUNT")

if [ "$TABLES_COUNT" -gt "0" ]; then
    echo "Database already has $TABLES_COUNT tables, checking for completeness..."
    
    # Check if all main tables exist
    PRODUCTS_EXISTS=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$MYSQL_DATABASE' AND TABLE_NAME = 'produits';" | grep -v "COUNT")
    USERS_EXISTS=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$MYSQL_DATABASE' AND TABLE_NAME = 'utilisateurs';" | grep -v "COUNT")
    
    if [ "$PRODUCTS_EXISTS" -eq "0" ] || [ "$USERS_EXISTS" -eq "0" ]; then
        echo "Database appears incomplete. Some tables are missing. Dropping and recreating database..."
        mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE $MYSQL_DATABASE; CREATE DATABASE $MYSQL_DATABASE;"
        
        echo "Importing full schema as some required tables were missing..."
        mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/fitzone_db.sql
        IMPORT_STATUS=$?
        
        if [ $IMPORT_STATUS -eq 0 ]; then
            echo "Schema imported successfully after detecting incomplete database."
        else
            echo "Error importing schema after detecting incomplete database! Error code: $IMPORT_STATUS"
            exit 1
        fi
    else
        echo "All required tables exist, skipping schema import."
    fi
else
    echo "Database appears empty, importing schema..."
    
    # Try with both users for maximum compatibility
    echo "Importing with normal user..."
    mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/fitzone_db.sql
    IMPORT_STATUS=$?
    
    if [ $IMPORT_STATUS -ne 0 ]; then
        echo "Error importing schema with standard user! Trying with root user..."
        mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/fitzone_db.sql
        IMPORT_STATUS=$?
        
        if [ $IMPORT_STATUS -eq 0 ]; then
            echo "Schema imported successfully with root user."
        else
            echo "Failed to import schema with both users! Check SQL file for errors."
            exit 1
        fi
    else
        echo "Schema imported successfully with standard user."
    fi
fi

# Verify import was successful
TABLES_COUNT_AFTER=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(TABLE_NAME) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$MYSQL_DATABASE';" | grep -v "COUNT")
PRODUCTS_COUNT=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM $MYSQL_DATABASE.produits;" 2>/dev/null | grep -v "COUNT")
USERS_COUNT=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM $MYSQL_DATABASE.utilisateurs;" 2>/dev/null | grep -v "COUNT")

echo "Database verification:"
echo "- Total tables: $TABLES_COUNT_AFTER"
echo "- Products: $PRODUCTS_COUNT"
echo "- Users: $USERS_COUNT"

# Final status report
if [ "$TABLES_COUNT_AFTER" -gt "10" ] && [ "$PRODUCTS_COUNT" -gt "0" ] && [ "$USERS_COUNT" -gt "0" ]; then
    echo "✅ DATABASE INITIALIZATION SUCCESSFUL"
    echo "  - Tables: $TABLES_COUNT_AFTER"
    echo "  - Products: $PRODUCTS_COUNT"
    echo "  - Users: $USERS_COUNT"
else
    echo "⚠️ DATABASE MAY BE INCOMPLETE"
    echo "  - Tables: $TABLES_COUNT_AFTER"
    echo "  - Products: $PRODUCTS_COUNT"
    echo "  - Users: $USERS_COUNT"
    echo "This might cause your application to malfunction."
fi

# Grant proper permissions
echo "Ensuring proper permissions..."
mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';"
mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" -e "FLUSH PRIVILEGES;"

echo "Database initialization process complete!"