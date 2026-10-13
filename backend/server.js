require("dotenv").config(); 

const express = require("express");
const cors = require("cors");
const db = require("./db");
const fetch = require("node-fetch");
const path = require("path");
const jwt = require("jsonwebtoken");

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

    const query = `
        SELECT id, username, password, role
        FROM users
        WHERE username = ? AND password = ?
        LIMIT 1
    `;

    db.query(query, [username, password], (err, results) => {
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
            role: user.role
        }
        });
    });
});


app.post("/api/register", (req, res) => {

    const { username, password } = req.body;

    const checkQuery = "SELECT * FROM users WHERE username = ?";

    db.query(checkQuery, [username], (err, result) => {

        if (err) {
            return res.status(500).json({ message: "Database Error" });
        }

        if (result.length > 0) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        const insertQuery =
            "INSERT INTO users (username, password) VALUES (?, ?)";

        db.query(insertQuery, [username, password], (err) => {

            if (err) {
                return res.status(500).json({
                    message: "Registration Failed"
                });
            }

            res.json({
                success: true,
                message: "Registration Successful"
            });

        });

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