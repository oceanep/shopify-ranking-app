const userAuth = require('./getUser')
const axios = require('axios')
const db = require('./db')
const moment = require('moment');

module.exports = {
    saveNewCollection: async (res) => {
          // {collectionId, collectionName, timeRange, restore}
          const {newCollectionId, title, smartCollection, timeInterval, restrictedArr} = res
          try {
            const queryText = 'INSERT INTO collections (collection_id, collection_name, smart_collection, time_range, restore) VALUES($1, $2, $3, $4, $5) RETURNING *'
            const collectionRes = await db.query(queryText, [newCollectionId, title, smartCollection, timeInterval, false])
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
    getAllShopifyCollections: async (shop, accessToken) => {
      return await axios({
          url: `https://${shop}/admin/api/graphql.json`,
          method: 'post',
          headers: { 'X-Shopify-Access-Token': accessToken },
          data: {
              query: `{
                collections(first:250) {
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
