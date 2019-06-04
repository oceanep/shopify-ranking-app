const db = require('./db')
const cron = require('node-cron');
const rank = require('./ranking')
const userAuth = require('./getUser')
const axios = require('axios');

const add_to_shopify_collection = async (collectionId, productIdArr, accessToken) => {
  const gqlProductArr = await productIdArr.map(id => `gid://shopify/Product/${id}`)
  console.log("gql arr", gqlProductArr)
  console.log(accessToken)
  const res = await axios({
      url: `https://kabir-test.myshopify.com/admin/api/graphql.json`,
      method: 'post',
      headers: { 'X-Shopify-Access-Token': accessToken },
      data: {
          query: `
            mutation {
              collectionAddProducts(id: "gid://shopify/Collection/${collectionId}", productIds: ${gqlProductArr}) {
                  job {
                    id
                  }
                  userErrors {
                    field
                    message
                  }
                }
            }
          `
      }
    })
  return res.data
}

cron.schedule('0 4 * * *', async () => {

  const allRankedCollections = await db.query(`SELECT * FROM collections`)
  const auth = await userAuth.getUser();
  const config = {
    headers: { 'X-Shopify-Access-Token': auth.access_token }
  }
  const appUsername = auth.app_username
  const appPassword = auth.app_password
  console.log(config)
  allRankedCollections.forEach(async collection => {
    let collectionId = collection.collection_id
    let timeInterval = collection.time_range
    let smartCollection = collection.smart_collection
    let restore = collection.restore
    // console.log(`sortedArr ${sortedArr} for collection ${collectionId}`)
    if (restore) {
      // grab dbRestrictedArr
      const queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
      const dbRestrictedArr = await db.query(queryText, [collectionId])
      console.log(dbRestrictedArr)
      // add products back to collection (gql)
      const addBack = await add_to_shopify_collection(collectionId, dbRestrictedArr, auth.access_token)
      // delete from db
      const deleteText = 'DELETE FROM restricted_items WHERE collection_id = ($1) RETURNING *'
      const deleteResult = await db.query(deleteText, [collectionId])
      console.log(deleteResult)
      // call rank
      let obj = rank.productRank(collectionId, timeInterval)
      console.log("ranked in cron", obj)
      // (will rank all products in collection, since we deleted from db filter won't find it + no current restriced array)
      // change back
      const restoreQuery = 'UPDATE restricted_items SET restore = ($1) WHERE collection_id = ($2) RETURNING *'
      const restoreResult = await db.query(restoreQuery, [false, collectionId])
    } else {
      // call rank normally (know if smart or not, know existing for sure)
      let regRank = rank.productRank(collectionId, timeInterval)
      console.log("ranked normally", regRank)
    }
  });

}, {
  scheduled: true,
  timezone: "Asia/Tokyo"
});
