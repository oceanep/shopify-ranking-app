import dotenv from "dotenv";
const Pool = require('pg').Pool
dotenv.config();

const { DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD} = process.env

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: 5432,
  ssl: true
})

module.exports = {
  query: async (text, params) => {
    try {
      const res = await pool.query(text, params)
      // console.log(res.rows)
      return res.rows
    } catch(err) {
      console.log(err.stack)
    }
  }
}
