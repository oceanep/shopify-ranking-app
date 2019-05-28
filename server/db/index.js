const Pool = require('pg').Pool
const connectionString = 'postgres://pcyjtmuhkajswg:9b550441c5dd07874a420c4c54828c5e88516c61b84d451c9d475f25794403b2@ec2-50-17-227-28.compute-1.amazonaws.com:5432/d8neqmlds0b2ut'

// production

const pool = new Pool({
  user: 'pcyjtmuhkajswg',
  host: 'ec2-50-17-227-28.compute-1.amazonaws.com',
  database: 'd8neqmlds0b2ut',
  password: '9b550441c5dd07874a420c4c54828c5e88516c61b84d451c9d475f25794403b2',
  port: 5432,
  ssl: true
})

// local testing

// const pool = new Pool({
//   user: 'kabirvirji',
//   host: 'localhost',
//   database: 'ranking',
//   password: 'password',
//   port: 5432,
// })

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
