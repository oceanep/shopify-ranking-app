//Ranking Algorithim
const dateFunctions = require('./dateFunctions')
const moment = require('moment')
const db = require('./db')
const userAuth = require('./getUser')
const axios = require('axios');
const filter = require('./filterRanked')

module.exports = {
  productRank: async (collectionId, timeInterval) => {
      console.log("product rank")
      //  get shop
      const shop = await userAuth.getUser();
      console.log(shop)
      const config = {
                       headers: { 'X-Shopify-Access-Token': shop.access_token }
                     }
      const url = `https://${shop.shop}/admin/api/2019-04/collects.json?collection_id=${collectionId}`
      //  query shopify
      const res = await axios.get(url, config) //collection data.collects[].productId
      const now = moment.utc(new Date())
      console.log('now', now)
      const start = dateFunctions.timeIntervalMoment(timeInterval, now)
      console.log('start, now',start, now)
      const startDay = await dateFunctions.dayCalc(start)
      const endDay = await dateFunctions.dayCalc(now)
      console.log("\nShopify response", res.data.collects)
      console.log(`\nStartDay ${startDay} EndDay ${endDay}`)
      //  query database directly 
      const arr = await Promise.all(res.data.collects.map( async collect => {
       let queryText = 'SELECT COUNT(*) FROM order_product_data WHERE (product_id = ($1)) AND (day BETWEEN ($2) and ($3))'
       let result = await db.query(queryText, [collect.product_id, startDay, endDay])
       return { productId: collect.product_id, rank: result[0].count}
      }))
      console.log(arr)
      //
      //    sort count array by count in reverse
      const sortedArr = arr.sort((a,b) => ( +b.rank - +a.rank))

      let collectionQueryText = 'SELECT * FROM collections WHERE collection_id = ($1)'
      let collectionResult = await db.query(collectionQueryText, [collectionId])
      console.log("collection result", collectionResult)
      if (!collectionResult[0].restore) {
        const final = await filter.filterRanked(collectionId, sortedArr)
        console.log('final sortedArr after filtering', final)
        return final
      }
      console.log('sorted arr', sortedArr)
      return sortedArr

  },
}
