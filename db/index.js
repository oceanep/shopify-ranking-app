

const connectionString = 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb'

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'Ocean',
  host: 'localhost',
  database: 'ranking',
  password: 'password',
  port: 5432,
})

// module.exports = {
//   query: (text, params) => {
//     const start = Date.now()
//     return pool.query(text, params, async (err, res) => {
//       try {
//         const duration = Date.now() - start
//         console.log('executed query', { text, duration, rows: res.rowCount })
//         console.log(res)
//         callback(err, res)
//       } catch (err) {
//         console.log(err)
//       }
//     })
//   }
// }

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
