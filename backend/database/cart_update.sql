-- Select the database first
USE `fitzone_db`;

-- Modify the cart table to better handle guest carts and improve structure
ALTER TABLE `cart` 
  MODIFY `id_utilisateur` int(11) NULL;

-- Check if session_id column already exists before adding it
SET @session_column_exists = (SELECT COUNT(*) 
                             FROM information_schema.COLUMNS 
                             WHERE TABLE_SCHEMA = 'fitzone_db' 
                             AND TABLE_NAME = 'cart' 
                             AND COLUMN_NAME = 'session_id');

-- Only add session_id column if it doesn't exist
SET @sql = IF(@session_column_exists = 0, 
             'ALTER TABLE cart ADD session_id varchar(255) NULL AFTER id_utilisateur', 
             'SELECT "session_id column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Don't try to add created_at as it already exists
-- Instead, update the column definition if needed
ALTER TABLE `cart` 
  MODIFY `created_at` datetime DEFAULT CURRENT_TIMESTAMP;

-- Check if updated_at exists before adding it
-- First, check if it exists using information_schema
SET @column_exists = (SELECT COUNT(*) 
                      FROM information_schema.COLUMNS 
                      WHERE TABLE_SCHEMA = 'fitzone_db' 
                      AND TABLE_NAME = 'cart' 
                      AND COLUMN_NAME = 'updated_at');

-- Only add updated_at column if it doesn't exist
SET @sql = IF(@column_exists = 0, 
             'ALTER TABLE cart ADD updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 
             'SELECT "updated_at column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add constraint to ensure either user_id or session_id exists
-- First check if the constraint exists
SET @constraint_exists = (SELECT COUNT(*) 
                         FROM information_schema.TABLE_CONSTRAINTS 
                         WHERE TABLE_SCHEMA = 'fitzone_db' 
                         AND TABLE_NAME = 'cart' 
                         AND CONSTRAINT_NAME = 'check_cart_owner');

-- Only add constraint if it doesn't exist
SET @sql = IF(@constraint_exists = 0, 
             'ALTER TABLE cart ADD CONSTRAINT check_cart_owner CHECK (id_utilisateur IS NOT NULL OR session_id IS NOT NULL)', 
             'SELECT "check_cart_owner constraint already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better performance if they don't exist
-- Check if MySQL version supports IF NOT EXISTS for indexes
SET @mysql_version = (SELECT VERSION());
SET @supports_if_not_exists = IF(@mysql_version LIKE '8.%', TRUE, FALSE);

-- Create the index on id_utilisateur if it doesn't exist
SET @index_user_exists = (SELECT COUNT(*) 
                         FROM information_schema.STATISTICS 
                         WHERE TABLE_SCHEMA = 'fitzone_db'
                         AND TABLE_NAME = 'cart'
                         AND INDEX_NAME = 'idx_cart_user');

-- Add index conditionally
SET @sql = IF(@index_user_exists = 0,
             IF(@supports_if_not_exists,
                'CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(id_utilisateur)',
                'CREATE INDEX idx_cart_user ON cart(id_utilisateur)'),
             'SELECT "idx_cart_user index already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create the index on session_id if it doesn't exist
SET @index_session_exists = (SELECT COUNT(*) 
                            FROM information_schema.STATISTICS 
                            WHERE TABLE_SCHEMA = 'fitzone_db'
                            AND TABLE_NAME = 'cart'
                            AND INDEX_NAME = 'idx_cart_session');

-- Add index conditionally
SET @sql = IF(@index_session_exists = 0,
             IF(@supports_if_not_exists,
                'CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id)',
                'CREATE INDEX idx_cart_session ON cart(session_id)'),
             'SELECT "idx_cart_session index already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
