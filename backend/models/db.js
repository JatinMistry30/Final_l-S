import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "lost_and_found_final",
});

const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to the database!");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

testConnection();

export default db;
