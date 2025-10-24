import mysql from "mysql2/promise";

// mysql 接続
export const conn = await mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "rootpass",
  database: "ragdb",
});

export const pool = mysql.createPool({
  host: "localhost",
  user: "appuser",
  password: "apppass",
  database: "ragdb",
  port: 3306,
  connectionLimit: 5,
});
