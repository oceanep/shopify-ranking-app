const db = require('./db')

module.exports = {

    getUser: async (shopName) => {
        try {
          // console.log('in db shop', shopName)
          const shop = await db.query(`SELECT * FROM my_user WHERE shop = $1`, [shopName]);
          // console.log('db returned', shop)
          return shop[0]
        } catch(err) {
          console.log(err)
        }
    },
    getAllShops: async () => {
      try {
        const shops = await db.query(`SELECT * FROM my_user`);
        return shops
      } catch(err) {
        console.log(err)
      }
    }

}
