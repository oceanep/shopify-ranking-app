

const connectionString = 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb'

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'ranking',
  password: 'password',
  port: 5432,
})

module.exports = {
  query: (text, params, callback) => {
    const start = Date.now()
    return pool.query(text, params, async (err, res) => {
      try {
        const duration = Date.now() - start
        console.log('executed query', { text, duration, rows: res.rowCount })
        callback(err, res)
      } catch (err) {
        console.log(err)
      }
    })
  }
}