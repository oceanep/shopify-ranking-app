//Ranking Algorithim
const dateFunctions = require('./dateFunctions')
const moment = require('moment')
const db = require('./db')
const userAuth = require('./getUser')
const axios = require('axios');
const filter = require('./filterRanked')

const bottomProducts = async (collectionId) => {
  let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
  let result = await db.query(queryText, [collectionId])
  console.log("result", result)
  let toConcat = result.map(obj => ({
    productId: obj.product_id,
    rank: -1
  }))
  return toConcat
}

module.exports = {
  productRank: async (collectionId, smartCollection, ruleSet, collectionTitle, timeInterval, restrictedArr) => { // needs to take what is being POSTed
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
      console.log(startDay)
      //  query database directly
      const arr = await Promise.all(res.data.collects.map( async collect => {
        console.log(typeof collect.product_id)
        let id = collect.product_id.toString()
        console.log(typeof id)
        console.log(id)
        let queryText = 'SELECT COUNT(*) FROM order_product_data WHERE (product_id = ($1)) AND (day BETWEEN ($2::int) and ($3::int))'
       let result = await db.query(queryText, [id, startDay, endDay])
       console.log("result", result)
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

        let oldTitle = collectionTitle

        if (smartCollection) { // if isSmartCollection
          let smartRules = ruleSet.rules

          console.log("new smart collection")
          let filteredArr = await filter.filterRanked(collectionId, sortedArr, restrictedArr)
          // console.log(filteredArr)
          let dataObj = {
            "smart_collection": {
              "title": `RANKED ${oldTitle}`,
              "sort_order": "manual",
              "rules": smartRules
            }
          }
          let newRules = JSON.stringify(dataObj).toLowerCase()
          // create new smart collection
          let createResult = await axios({
            method: 'post',
            url: `https://${shop.shop}/admin/api/2019-04/smart_collections.json`,
            data: newRules,
            headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
          })
          const newCollectionId = createResult.data.smart_collection.id
          const title = createResult.data.smart_collection.title
          const dataArr = filteredArr.map(x => x.productId)
          // order the smart collection
          let orderResult = await axios({
            method: 'put',
            url: `https://${shop.shop}/admin/api/2019-04/smart_collections/${newCollectionId}/order.json`,
            data: {
              "products": dataArr
            },
            headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
          })
          console.log(orderResult.data)

          return {
            newCollectionId: newCollectionId,
            title: title,
            smartCollection: true,
            new: true,
            timeInterval: timeInterval,
            restrictedArr: restrictedArr
          }

        } else { // if custom
          console.log("new custom collection")
          let filteredArr = await filter.filterRanked(collectionId, sortedArr, restrictedArr)
          console.log(filteredArr)
          let collects = filteredArr.map((product, i) => {
            return {
              product_id: product.productId,
              position: +i + 1
            }
          })
          console.log("collects", collects)
          let dataObj = {
            "custom_collection": {
              "title": `RANKED ${oldTitle}`,
              "sort_order": "manual",
              "collects": collects
            }
          }
          let createCustomCollection = await axios({
            method: 'post',
            url: `https://${shop.shop}/admin/api/2019-04/custom_collections.json`,
            data: dataObj,
            headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
          })
          console.log(createCustomCollection.data)

          const newCollectionId = createResult.data.smart_collection.id
          const title = createResult.data.smart_collection.title

          return {
            newCollectionId: newCollectionId,
            title: title,
            smartCollection: false,
            new: true,
            restrictedArr: restrictedArr
          }

        }

      } else {
        if (collectionResult[0].smart_collection) { // if smart collection
          console.log("existing smart collection")

          let filteredArr = await filter.filterRanked(collectionId, sortedArr)
          console.log("filteredArr", filteredArr)
          console.log("bottomProducts:", await bottomProducts(collectionId))
          let totalArr = filteredArr.concat(await bottomProducts(collectionId))

          const dataArr = totalArr.map(x => +x.productId)

          console.log("dataArr", dataArr)
          let orderResult = await axios({
            method: 'put',
            url: `https://${shop.shop}/admin/api/2019-04/smart_collections/${collectionId}/order.json`,
            data: {
              "products": dataArr
            },
            headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
          })
          console.log("order result", orderResult.data)
          return {
            newCollectionId: collectionId,
            title: null,
            smartCollection: true,
            new: false,
            restrictedArr: restrictedArr
          }

        } else { // if custom
          console.log("existing custom collection")
          let restrictedArr = []
          let filteredArr = await filter.filterRanked(collectionId, sortedArr, restrictedArr, true, shop.access_token)
          console.log(filteredArr)

          return {
            newCollectionId: collectionId,
            title: null,
            smartCollection: false,
            new: false,
            restrictedArr: restrictedArr
          }

        }

      }

  },
}
