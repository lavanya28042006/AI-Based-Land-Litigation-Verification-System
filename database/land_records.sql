CREATE DATABASE IF NOT EXISTS land_verification;
USE land_verification;

CREATE TABLE land_records (
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

CREATE TABLE court_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    land_id INT,
    case_number VARCHAR(100),
    court_name VARCHAR(150),
    case_type VARCHAR(100),
    status VARCHAR(50),
    FOREIGN KEY (land_id) REFERENCES land_records(id)
);

INSERT INTO land_records
(district, taluk, village, survey_number, owner_name, patta_number, land_area, land_type)
VALUES
('Salem', 'Salem West', 'Pommalappatti', '45/2A', 'Kumar', '56789', '1.75 Acres', 'Agricultural'),
('Madurai', 'Madurai North', 'Alanganallur', '12/4B', 'Ramesh', '98765', '2 Acres', 'Residential');

INSERT INTO land_records
(district, taluk, village, survey_number, owner_name, patta_number, land_area, land_type, case_number, court_name, case_type, status)
VALUES
('Salem', 'Salem West', 'Ammapet', '14/2B', 'Ravi', '88990', '2 Acres', 'Residential', NULL, NULL, NULL, 'Closed');

INSERT INTO court_cases
(land_id, case_number, court_name, case_type, status)
VALUES
(1, 'O.S.123/2025', 'District Court Salem', 'Ownership Dispute', 'Pending');



UPDATE land_records
SET status = 'Closed'
WHERE survey_number = '14/2B';