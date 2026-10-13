require("dotenv").config(); 

const express = require("express");
const cors = require("cors");
const db = require("./db");
const fetch = require("node-fetch");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication token required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
}

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/api/land", (req, res) => {
    const query = `
    SELECT 
       lr.id,
        lr.district,
        lr.taluk,
        lr.village,
        lr.survey_number,
        lr.owner_name,
        lr.patta_number,
        lr.land_area,
        lr.land_type,

        COALESCE(cc.case_number, NULL) AS case_number,
        COALESCE(cc.court_name, NULL) AS court_name,
        COALESCE(cc.case_type, NULL) AS case_type,
        COALESCE(cc.status, 'Closed') AS status

        FROM land_records lr

        LEFT JOIN court_cases cc 
        ON lr.id = cc.land_id

        GROUP BY lr.id
        `;

    db.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ message: "Database Error" });
        } else {
            res.json(result);
        }
    });
});


app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    const trimmedIdentifier = username.trim();

    const query = `
        SELECT id, username, email, password, role
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
    `;

    db.query(query, [trimmedIdentifier, trimmedIdentifier], async (err, results) => {
        if (err) {
            console.error("Login database error:", err);

            return res.status(500).json({
                success: false,
                message: "Server error during login"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const user = results[0];

        try {
            let isMatch = false;

            // Check if stored password is a bcrypt hash
            if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$"))) {
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                // Fallback for legacy plaintext passwords
                isMatch = (user.password === password);
                if (isMatch) {
                    // Transparently upgrade legacy plaintext password to bcrypt hash
                    const upgradedHash = await bcrypt.hash(password, 10);
                    db.query("UPDATE users SET password = ? WHERE id = ?", [upgradedHash, user.id], (upgradeErr) => {
                        if (upgradeErr) console.error("Transparent password upgrade error:", upgradeErr);
                    });
                }
            }

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            return res.json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (verifyError) {
            console.error("Password verification error:", verifyError);
            return res.status(500).json({
                success: false,
                message: "Server error during password verification"
            });
        }
    });
});


app.post("/api/register", async (req, res) => {
    const { username, email, password, securityQuestion, securityAnswer } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    const trimmedUsername = username.trim();
    const resolvedEmail = (email && email.trim()) || (trimmedUsername.includes("@") ? trimmedUsername : null);

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        });
    }

    const checkQuery = "SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?) LIMIT 1";

    db.query(checkQuery, [trimmedUsername, resolvedEmail], async (err, result) => {
        if (err) {
            console.error("Register check query error:", err);
            return res.status(500).json({ message: "Database Error" });
        }

        if (result.length > 0) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        try {
            // Hash password before saving
            const hashedPassword = await bcrypt.hash(password, 10);
            const secQuestion = (securityQuestion && securityQuestion.trim()) || "What is your registered 4-digit PIN?";
            const secAnswer = (securityAnswer && securityAnswer.trim()) || "1234";

            const insertQuery = `
                INSERT INTO users (username, email, password, security_question, security_answer, role)
                VALUES (?, ?, ?, ?, ?, 'USER')
            `;

            db.query(insertQuery, [trimmedUsername, resolvedEmail, hashedPassword, secQuestion, secAnswer], (insertErr) => {
                if (insertErr) {
                    console.error("Register insert error:", insertErr);
                    return res.status(500).json({
                        success: false,
                        message: "Registration Failed"
                    });
                }

                return res.json({
                    success: true,
                    message: "Registration Successful"
                });
            });
        } catch (hashError) {
            console.error("Register hash error:", hashError);
            return res.status(500).json({
                success: false,
                message: "Error processing registration"
            });
        }
    });
});


app.post("/api/forgot-password/security-question", (req, res) => {
    const { email } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({
            success: false,
            message: "Email address is required"
        });
    }

    const trimmedEmail = email.trim();

    const query = `
        SELECT id, username, email, security_question
        FROM users
        WHERE email = ? OR username = ?
        LIMIT 1
    `;

    db.query(query, [trimmedEmail, trimmedEmail], (err, results) => {
        if (err) {
            console.error("Fetch security question error:", err);
            return res.status(500).json({
                success: false,
                message: "Server error checking email"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address"
            });
        }

        const user = results[0];
        return res.json({
            success: true,
            securityQuestion: user.security_question || "What is your registered 4-digit PIN?"
        });
    });
});


app.post("/api/forgot-password", async (req, res) => {
    const { email, securityAnswer, newPassword, confirmPassword } = req.body;

    if (!email || !securityAnswer || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const trimmedEmail = email.trim();
    const trimmedAnswer = securityAnswer.trim().toLowerCase();

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "New password and Confirm password do not match"
        });
    }

    const query = `
        SELECT id, username, email, password, security_answer
        FROM users
        WHERE email = ? OR username = ?
        LIMIT 1
    `;

    db.query(query, [trimmedEmail, trimmedEmail], async (err, results) => {
        if (err) {
            console.error("Forgot password database error:", err);
            return res.status(500).json({
                success: false,
                message: "Server error during password reset"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address"
            });
        }

        const user = results[0];
        const storedAnswer = (user.security_answer || "").trim().toLowerCase();

        // Security requirement: Identity verification step
        if (!storedAnswer || storedAnswer !== trimmedAnswer) {
            return res.status(401).json({
                success: false,
                message: "Identity verification failed: Incorrect security answer or PIN"
            });
        }

        try {
            // Prevent reusing current password
            let isSamePassword = false;
            if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$"))) {
                isSamePassword = await bcrypt.compare(newPassword, user.password);
            } else {
                isSamePassword = (user.password === newPassword);
            }

            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    message: "New password cannot be the same as your old password"
                });
            }

            // Hash new password using bcrypt
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updateQuery = "UPDATE users SET password = ? WHERE id = ?";
            db.query(updateQuery, [hashedPassword, user.id], (updateErr) => {
                if (updateErr) {
                    console.error("Update password error:", updateErr);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to update password in database"
                    });
                }

                return res.json({
                    success: true,
                    message: "Password updated successfully! You can now log in with your new password."
                });
            });
        } catch (hashError) {
            console.error("Password hash error:", hashError);
            return res.status(500).json({
                success: false,
                message: "Server error processing new password"
            });
        }
    });
});


app.post("/api/add-land", authenticateToken, requireAdmin, (req, res) => {
    const {
        district,
        taluk,
        village,
        survey,
        owner,
        patta,
        area,
        landType
    } = req.body;

    const query = `
        INSERT INTO land_records
        (
            district,
            taluk,
            village,
            survey_number,
            owner_name,
            patta_number,
            land_area,
            land_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            district,
            taluk,
            village,
            survey,
            owner,
            patta,
            area,
            landType
        ],
        (err, result) => {
            if (err) {
                console.error("Add land error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Error adding record"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Record Added Successfully / பதிவு சேர்க்கப்பட்டது"
            });
        }
    );
});


app.post("/api/search-history", authenticateToken, (req, res) => {
    const {
        district,
        taluk,
        village,
        survey_number,
        result_found
    } = req.body;

    const userId = req.user.id;

    if (!survey_number) {
        return res.status(400).json({
            success: false,
            message: "Survey number is required"
        });
    }

    const query = `
        INSERT INTO search_history
        (user_id, district, taluk, village, survey_number, result_found)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            userId,
            district || null,
            taluk || null,
            village || null,
            survey_number,
            Boolean(result_found)
        ],
        (err, result) => {
            if (err) {
                console.error("Search history error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to save search history"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Search history saved successfully"
            });
        }
    );
});


app.post("/api/ai-check", async (req, res) => {
    try {
        const landData = req.body;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.LAND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: `
                            நீங்கள் ஒரு தமிழ் நில வழக்கு AI உதவியாளர்.

                            கீழே உள்ள நில விவரத்தை analyze செய்து:

                            1. Risk Level மட்டும் Englishல் சொல்லவும் (Low / Medium / High)
                            2. காரணத்தை தமிழில் சொல்லவும்
                            3. பரிந்துரையை தமிழில் சொல்லவும்

                            மிகவும் short மற்றும் simple ஆக இருக்க வேண்டும்.

                            Land Data:
                            ${JSON.stringify(landData)}
                        `
                    }
                ]
            })
        });

        const data = await response.json();

        console.log(data);

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI Error" });
    }
});

app.get("/api/search-history", authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT
            id,
            district,
            taluk,
            village,
            survey_number,
            result_found,
            searched_at
        FROM search_history
        WHERE user_id = ?
        ORDER BY searched_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Fetch search history error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch search history"
            });
        }

        return res.json({
            success: true,
            history: results
        });
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});