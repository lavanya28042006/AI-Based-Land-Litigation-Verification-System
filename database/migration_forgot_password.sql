-- Migration: Add email, security_question, security_answer to users table
-- and ensure password column can hold bcrypt hashes.

USE land_verification;

-- 1. Add email column if it does not exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'land_verification' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'email';

SET @stmt = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE NULL AFTER username', 
    'SELECT "email column already exists"');
PREPARE run_stmt FROM @stmt;
EXECUTE run_stmt;
DEALLOCATE PREPARE run_stmt;

-- 2. Modify password column to VARCHAR(255) to safely hold bcrypt hashes
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL;

-- 3. Add security_question column if it does not exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'land_verification' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'security_question';

SET @stmt = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN security_question VARCHAR(255) DEFAULT "What is your registered 4-digit PIN?" AFTER role', 
    'SELECT "security_question column already exists"');
PREPARE run_stmt FROM @stmt;
EXECUTE run_stmt;
DEALLOCATE PREPARE run_stmt;

-- 4. Add security_answer column if it does not exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'land_verification' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'security_answer';

SET @stmt = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN security_answer VARCHAR(255) DEFAULT "1234" AFTER security_question', 
    'SELECT "security_answer column already exists"');
PREPARE run_stmt FROM @stmt;
EXECUTE run_stmt;
DEALLOCATE PREPARE run_stmt;

-- 5. Backfill email for existing users where username looks like an email
UPDATE users 
SET email = username 
WHERE (email IS NULL OR email = '') AND username LIKE '%@%';

-- 6. Backfill email for admin
UPDATE users 
SET email = 'admin@example.com' 
WHERE username = 'admin' AND (email IS NULL OR email = '');

-- 7. Ensure security question and answer are set for existing users
UPDATE users 
SET security_question = 'What is your registered 4-digit PIN?' 
WHERE security_question IS NULL OR security_question = '';

UPDATE users 
SET security_answer = '1234' 
WHERE security_answer IS NULL OR security_answer = '';
