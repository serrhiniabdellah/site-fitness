-- Initialize the FitZone database
CREATE DATABASE IF NOT EXISTS fitzone_db;
USE fitzone_db;

-- The complete schema will be imported from the copied SQL file in the same directory
SOURCE /docker-entrypoint-initdb.d/fitzone_db.sql;