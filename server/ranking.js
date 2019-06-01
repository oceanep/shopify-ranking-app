//Ranking Algorithim
const dateFunctions = require('./dateFunctions')
const moment = require('moment')
const db = require('./db')
const userAuth = require('./getUser')
const axios = require('axios');
const filter = require('./filterRanked')

// check if smart collection
const isSmartCollection = async (id, accessToken) => {
  const res = await axios({
    url: `https://kabir-test.myshopify.com/admin/api/graphql.json`,
    method: 'post',
    headers: { 'X-Shopify-Access-Token': accessToken },
    data: {
        query: `
          {
            collection(id:"gid://shopify/Collection/${id}") {
                id
                ruleSet {
                  rules {
                    column
                    condition
                    relation
                  }
                }
            }
          }
        `
    }
  })
  
  return (res.data.data.collection.ruleSet !== null)

}
// const createSmartCollection = () => {}
// const createCustomCollection = () => {}
// const updateSmartCollection = () => {}
// const updateCustomCollection = () => {}

module.exports = {
  productRank: async (collectionId, timeInterval) => { // old collection id
      console.log("product rank")
      //  get shop
      const shop = await userAuth.getUser();
      const appUsername = shop.app_username
      const appPassword = shop.app_password
      console.log(shop)
      const config = {
                       headers: { 'X-Shopify-Access-Token': shop.access_token }
                     }
      const url = `https://${shop.shop}/admin/api/2019-04/collects.json?collection_id=${collectionId}`
      // const url = `https://kabir-test.myshopify.com/admin/api/2019-04/smart_collections/101723930691.json`
      //  query shopify
      const res = await axios.get(url, config) //collection data.collects[].productId
      
      console.log("type", res.data)
      const now = moment.utc(new Date())
      console.log('now', now)
      const start = dateFunctions.timeIntervalMoment(timeInterval, now)
      console.log('start, now',start, now)
      const startDay = await dateFunctions.dayCalc(start)
      const endDay = await dateFunctions.dayCalc(now)
      // console.log("\nShopify response", res.data.collects)
      console.log(`\nStartDay ${startDay} EndDay ${endDay}`)
      //  query database directly 
      const arr = await Promise.all(res.data.collects.map( async collect => {
       let queryText = 'SELECT COUNT(*) FROM order_product_data WHERE (product_id = ($1)) AND (day BETWEEN ($2) and ($3))'
       let result = await db.query(queryText, [collect.product_id, startDay, endDay])
       return { productId: collect.product_id, rank: result[0].count}
      }))
      // console.log(arr)
      //
      //    sort count array by count in reverse
      const sortedArr = arr.sort((a,b) => ( +b.rank - +a.rank))

      let collectionQueryText = 'SELECT * FROM collections WHERE collection_id = ($1)'
      let collectionResult = await db.query(collectionQueryText, [collectionId])
      console.log("collection result", collectionResult)

      // get name of collection

      if (collectionResult.length === 0) { 
        let isSmart = await isSmartCollection(collectionId, shop.access_token)
        if (isSmart) { 
          console.log("new smart collection")
          // filter(sortedArr)
          // take given smart rules and use those in api post
          // filter with sent back array (change filter function to include this)
          // use restricted items array -> filter out in ranking (filter to bottom)
        } else { // if custom
          console.log("new custom collection")
          // filter(sortedArr)
          // use restricted items array -> filter out in ranking -> delete
        }

      } else { 
        if (collectionResult.smart_collection) { // if smart collection
          console.log("existing smart collection")
          // filter(sortedArr)
        } else { // if custom
          console.log("existing custom collection")
          // filter(sortedArr)
          // (pass filtered as true)
        }
        // add to db, make db calls (add restricted products, add to our own collections)

      }

      // if (!collectionResult[0].restore) {
      //   const final = await filter.filterRanked(collectionId, sortedArr)
      //   console.log('final sortedArr after filtering', final)
      //   return final
      // }
      // console.log('sorted arr', sortedArr)
      return sortedArr

  },
}
