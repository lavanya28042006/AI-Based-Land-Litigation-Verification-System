CREATE DATABASE IF NOT EXISTS land_verification;
USE land_verification;

CREATE TABLE IF NOT EXISTS land_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district VARCHAR(100),
    taluk VARCHAR(100),
    village VARCHAR(100),
    survey_number VARCHAR(50),
    owner_name VARCHAR(100),
    patta_number VARCHAR(50),
    land_area VARCHAR(50),
    land_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS court_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    land_id INT,
    case_number VARCHAR(100),
    court_name VARCHAR(150),
    case_type VARCHAR(100),
    status VARCHAR(50),
    FOREIGN KEY (land_id) REFERENCES land_records(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    security_question VARCHAR(255) DEFAULT 'What is your registered 4-digit PIN?',
    security_answer VARCHAR(255) DEFAULT '1234'
);

CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    district VARCHAR(100),
    taluk VARCHAR(100),
    village VARCHAR(100),
    survey_number VARCHAR(100),
    result_found TINYINT(1) DEFAULT 0,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO land_records
(district, taluk, village, survey_number, owner_name, patta_number, land_area, land_type)
VALUES
('Salem', 'Salem West', 'Pommalappatti', '45/2A', 'Kumar', '56789', '1.75 Acres', 'Agricultural'),
('Madurai', 'Madurai North', 'Alanganallur', '12/4B', 'Ramesh', '98765', '2 Acres', 'Residential')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO court_cases
(land_id, case_number, court_name, case_type, status)
VALUES
(1, 'O.S.123/2025', 'District Court Salem', 'Ownership Dispute', 'Pending')
ON DUPLICATE KEY UPDATE id=id;