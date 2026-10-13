# AI-Based Land Litigation Verification System
### AI மூலம் நில வழக்கு சரிபார்ப்பு அமைப்பு

An intelligent full-stack web application designed to verify land ownership records, check litigation and court case status, and provide AI-driven land dispute risk assessments.

---

## 🌟 Key Features

1. **User Authentication & Role-Based Access Control**:
   - Secure login and registration with JWT token-based authentication.
   - Admin access control for managing and inserting land records.
2. **Land Record Verification**:
   - Query land records by District, Taluk, Village, and Survey Number.
   - Instant verification of ownership details, patta numbers, land area, and land classification.
3. **Litigation & Court Case Checking**:
   - Seamless linkage between land registry data and active/disposed court cases.
   - Status indicators for pending, disposed, and disputed records.
4. **AI-Powered Risk Analysis**:
   - Integration with OpenRouter API for automated legal risk evaluation.
   - Bilingual AI risk summaries and recommendations (Tamil and English).
5. **Search History & User Dashboard**:
   - Per-user search logs tracking previous verifications.
   - Dashboard statistics summarizing total verifications and findings.
6. **Report Generation**:
   - Client-side PDF export and print formatting for official verification certificates.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL (via XAMPP / phpMyAdmin)
- **Authentication**: JSON Web Token (JWT)
- **AI Integration**: OpenRouter API (`openai/gpt-3.5-turbo`)
- **PDF Generation**: html2canvas & jsPDF

---

## 📁 Project Structure

```text
├── ai/
│   └── embedding.py            # AI TF-IDF similarity prototype
├── backend/
│   ├── controllers/            # Controller modules
│   ├── models/                 # Data model schemas
│   ├── routes/                 # Express API routes
│   ├── db.js                   # MySQL database connection
│   ├── server.js               # Main Express application server
│   ├── package.json            # Node.js dependencies and scripts
│   └── .env.example            # Environment configuration template
├── database/
│   └── land_records.sql        # MySQL database schema and sample records
├── frontend/
│   ├── assets/                 # Images, logos, and icons
│   ├── css/                    # Stylesheets (home.css, style.css)
│   ├── js/                     # Client scripts (app.js, admin.js, etc.)
│   ├── index.html              # Landing page
│   ├── dashboard.html          # User dashboard
│   ├── search.html             # Land verification search
│   ├── search-history.html     # Verification history
│   ├── about.html              # About project & documentation
│   ├── admin.html              # Admin portal
│   ├── login.html              # User & admin login
│   └── register.html           # User registration
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [XAMPP](https://www.apachefriends.org/) (Apache and MySQL services)

### 2. Database Setup
1. Open XAMPP Control Panel and start **Apache** and **MySQL**.
2. Navigate to `http://localhost/phpmyadmin`.
3. Create a database named `land_verification`.
4. Import the schema script located at `database/land_records.sql`.

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template and configure your keys:
   ```bash
   cp .env.example .env
   ```
   Add your `JWT_SECRET` and OpenRouter API key (`LAND_API_KEY`).

4. Start the server:
   ```bash
   node server.js
   ```

### 4. Open Application
Once the server is running, open your browser and navigate to:
```text
http://localhost:5000
```
