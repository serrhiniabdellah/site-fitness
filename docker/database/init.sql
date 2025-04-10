-- Initialize the FitZone database
CREATE DATABASE IF NOT EXISTS fitzone_db;
USE fitzone_db;

-- Set variables to capture errors
SET @had_error = 0;

-- Try to source the schema file with error handling
SOURCE /docker-entrypoint-initdb.d/fitzone_db.sql;

-- If we get here without error, display success message
SELECT 'Database schema successfully imported' as 'Import Status';

-- Alternative approach - if SOURCE fails, we can use this block
-- This enables MySQL to show detailed errors if SOURCE command fails
DELIMITER //
BEGIN NOT ATOMIC
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
  BEGIN
    SET @had_error = 1;
    SELECT 'Error importing schema file' as 'Import Status';
  END;
  
  -- If direct SOURCE failed and we're still executing
  IF @had_error = 1 THEN
    -- Try to read file and execute manually
    SELECT CONCAT('SOURCE operation failed. Check if /docker-entrypoint-initdb.d/fitzone_db.sql exists and is readable.') 
    AS 'Import Error';
  END IF;
END //
DELIMITER ;