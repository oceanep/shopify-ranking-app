const db = require('../db')

module.exports = {

    getUser: async () => { 
        try {
          const shop = await db.query(`SELECT * FROM my_user`);
          return shop[0]
        } catch(err) {
          console.log(err)
        }
    }

}