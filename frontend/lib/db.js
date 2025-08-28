import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root", // Change if necessary
  password: "", // Change if necessary
  database: "learnersville_db",
});
