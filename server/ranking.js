//Ranking Algorithim
const dateFunctions = require('./dateFunctions')
const moment = require('moment')
const db = require('../db')
const userAuth = require('./getUser')
const axios = require('axios');


module.exports = {
  productRank: async (collectionId, timeInterval) => {
      console.log("custom product rank")
      //  get shop
      const shop = await userAuth.getUser();
      console.log(shop)
      const config = {
                       headers: { 'X-Shopify-Access-Token': shop.access_token }
                     }
      const url = `https://${shop.shop}/admin/api/2019-04/collects.json?collection_id=${collectionId}`
      //  query shopify
      const res = await axios.get(url, config) //collection data.collects[].productId
      const now = moment.utc()
      const start = dateFunctions.timeIntervalMoment(timeInterval, now)
      const startDay = dateFunctions.dayCalc(start)
      const endDay = dateFunctions.dayCalc(now)
      console.log(`\nShopify response ${res} StartDay ${startDay} EndDay ${endDay}`)
      //  query database directly
      // res.data.collects.map( async collect => {
      //  let queryText = 'SELECT COUNT(*) FROM order_product_data WHERE (product_id = ($1)) AND (day BETWEEN ($2) and ($3))'
      //  let result = await db.query(queryText, [collect.productId, startDay, endDay])
      //  return { productId: collect.productId, rank: result[0].count}
      // })
      //
      //    sort count array by count in reverse
  },
}
