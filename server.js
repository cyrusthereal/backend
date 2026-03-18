const http = require("http");
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

db.connect(err => {
    if(err)throw err;
    console.log("Connected to database");
})

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request handling
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/insert") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        // Parse the full name into first and last name
        const nameParts = data.Name ? data.Name.trim().split(/\s+/) : [];
        const firstName = nameParts[0] || data.fName || '';
        const lastName = nameParts.slice(1).join(' ') || data.LName || '';
        
        const sql = `INSERT INTO students (first_Name, last_Name, StudentNumber, Birthday, Address, Email, Viber, Course, Year_Graduated)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
          firstName,
          lastName,
          data.StudentNumber,
          data.Birthday,
          data.Address,
          data.Email,
          data.Viber,
          data.Course,
          data.Year_Graduated
        ];
        db.query(sql, values, (err, result) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Insert failed: " + err.message }));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ id: result.insertId }));
          }
        });
      } catch (parseError) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON: " + parseError.message }));
      }
    });
  }

  else if (req.method === "DELETE" && req.url.startsWith("/delete")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");
    if (!id) {
      res.writeHead(400);
      res.end("Missing student ID");
      return;
    }

    db.query("DELETE FROM students WHERE Id = ?", [id], (err, result) => {
      if (err) {
        res.writeHead(500);
        res.end("Delete failed: " + err.message);
      } else {
        res.writeHead(200);
        res.end("Deleted student with ID: " + id);
      }
    });
  }

  else if (req.method === "GET" && req.url === "/select") {
    db.query("SELECT * FROM students", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Select failed: " + err.message }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    });
  }

  else {
    res.writeHead(404);
    res.end("Not found");
  }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
