const Pool = require('pg').Pool
const connectionString = 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb'

// production
// const pool = new Pool({
//   connectionString: connectionString,
// })

// local testing
const pool = new Pool({
  user: 'kabirvirji',
  host: 'localhost',
  database: 'ranking',
  password: 'password',
  port: 5432,
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
