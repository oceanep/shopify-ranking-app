const userAuth = require('./getUser')
const axios = require('axios')
const db = require('./db')
const moment = require('moment');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

module.exports = {
    saveNewCollection: async (res, shop) => {
          // {collectionId, collectionName, timeRange, restore}
          const {newCollectionId, title, smartCollection, timeInterval, restrictedArr} = res
          try {
            const queryText = 'INSERT INTO collections (collection_id, collection_name, smart_collection, time_range, restore, shop) VALUES($1, $2, $3, $4, $5, $6) RETURNING *'
            const collectionRes = await db.query(queryText, [newCollectionId, title, smartCollection, timeInterval, false, shop])
            const restrictedQueryText = 'INSERT INTO restricted_items (collection_id, product_id) VALUES($1, $2) RETURNING *'
            const restrictedRes = await Promise.all(restrictedArr.map( async productId => {
              let res = await db.query(restrictedQueryText, [newCollectionId, productId])
              return res
            }))
            console.log("New Collection Inserted", collectionRes)
            console.log("Restricted Items Inserted", restrictedRes)
            return [collectionRes, restrictedRes]
          }catch(err) {
            console.log(err)
          }
        },
    getAllShopifyCollections: async (shop, accessToken, cursor = '') => {
      console.log('Get all Shopify Collections', shop, accessToken, cursor)
      try {
        let res = await axios({
            url: `https://${shop}/admin/api/graphql.json`,
            method: 'post',
            headers: { 'X-Shopify-Access-Token': accessToken },
            data: {
                query: `{
                  collections(first:250 ${cursor ? `,after:"${cursor}"` : ''}) {
                    edges {
                      cursor
                      node {
                        id
                        title
                        ruleSet{
                            appliedDisjunctively
                            rules{
                              column
                              condition
                              relation
                            }
                          }
                        }
                      }
                      pageInfo {
                      hasNextPage
                    }
                  }
                }`
            }
        })
        if (res.data.errors) throw `${res.data.errors[0].message}`
        let collectionsArray = res.data.data.collections.edges

        let finalIdx = collectionsArray.length - 1
        let collectionsCursor = collectionsArray[finalIdx].cursor
        let paginate = res.data.data.collections.pageInfo.hasNextPage // boolean

        console.log("collectionPaginate ", paginate, collectionsArray)

        console.log("CURRENT THROTTLE LIMIT", res.data.extensions.cost.throttleStatus) // currentlyAvailable
        if(res.data.extensions.cost.throttleStatus.currentlyAvailable<500){
          let timetowait = Math.round( parseInt(res.data.extensions.cost.requestedQueryCost) / 50)
          console.log(timetowait)
          await sleep(timetowait * 1000)
          console.log("SLEPT")
        }

        return paginate ? collectionsArray.concat(await module.exports.getAllShopifyCollections(shop, accessToken, collectionsCursor)) : collectionsArray
      }
      catch(err){
        console.log(err)
        throw err
      }
    },
    getCollectionPublications: async (shop, accessToken, collectionId) => {
      //failing on access denied, no idea why
      try{
        console.log('publication shop and accessToken', shop, accessToken)
        let res = await axios({
            url: `https://${shop}/admin/api/graphql.json`,
            method: 'post',
            headers: { 'X-Shopify-Access-Token': accessToken },
            data: {
                query: `{
                  collection(id: "${collectionId}") {
              			resourcePublications(first:10){
                      edges{
                        node{
                          publication {
                            id
                          }
                        }
                      }
                    }
                  }
                }`
            }
        })
        console.log(res.data)
        if (!res.data.data) throw `${res.data.errors[0].message}`

        return res.data.data.resourcePublications
      }catch(err){
        console.log(err)
      }
    }
}
