const mysql = require("F:/Desktop/HavenDB/node_modules/mysql2");
const db = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "admin123",
    database: "my-haven"
});
db.query("ALTER TABLE userinfo MODIFY COLUMN password VARCHAR(255) NOT NULL", (err, result) => {
    if (err) { console.error("ERR:", err.message); process.exit(1); }
    console.log("OK:", result.message || "Column modified");
    process.exit(0);
});
