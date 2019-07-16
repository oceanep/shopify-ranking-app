const db = require('./db')
const cron = require('node-cron');
const rank = require('./ranking')
const userAuth = require('./getUser')
const axios = require('axios');

const add_to_shopify_collection = async (collectionId, productIdArr, shop, accessToken) => {
  try{
    const gqlProductArr = productIdArr.map(id => `gid://shopify/Product/${id}`)
    console.log("gql ADD arr", gqlProductArr)
    console.log(accessToken)
    const res = await axios({
        url: `https://${shop}/admin/api/graphql.json`,
        method: 'post',
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: {
            query: `
              mutation collectionAddProducts($id:ID!, $productIds:[ID!]!){
                collectionAddProducts(id: $id, productIds: $productIds) {
                    collection {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
              }
            `,
            variables: {
              id: `gid://shopify/Collection/${collectionId}`,
              productIds: gqlProductArr
            }
        }
      })
    if (res.data.errors) throw res.data.errors
    return res.data
  }
  catch(err){
    console.log(err)
  }
}

const cronRestoredSmart = async (collectionId, smartCollection, collectionTitle, timeInterval, shop) => {
  try{
    //delete restricted items from database
    const deleteText = 'DELETE FROM restricted_items WHERE collection_id = ($1) RETURNING *'
    const deleteResult = await db.query(deleteText, [collectionId])
    console.log(deleteResult)
    //call ranking with empty restrictedArr
    let obj = await rank.productRank(collectionId, smartCollection, {}, collectionTitle, timeInterval, {}, shop)
    console.log("ranked in cron", obj)
  }
  catch(err){
    console.log(err)
  }
}

const cronRestoredCustom = async (restrictedArr, collectionId, smartCollection, collectionTitle, timeInterval, shop, accessToken) => {
  try{
    //add restricted items back to collection via shopify
    console.log('\n cron restored custom: ', shop, accessToken)
    const addBack = await add_to_shopify_collection(collectionId, restrictedArr, shop, accessToken)
    //delete restricted items from database
    const deleteText = 'DELETE FROM restricted_items WHERE collection_id = ($1) RETURNING *'
    const deleteResult = await db.query(deleteText, [collectionId])
    console.log(deleteResult)
    //call ranking with empty restrictedArr
    let obj = await rank.productRank(collectionId, smartCollection, {}, collectionTitle, timeInterval, {}, shop)
    console.log("ranked in cron", obj)
  }
  catch(err){
    console.log(err)
  }
}

const cronNormal = async (restrictedArr, collectionId, smartCollection, collectionTitle, timeInterval, shop) => {
  try{
    //call ranking with dbRestrictedArr
    let obj = await rank.productRank(collectionId, smartCollection, {}, collectionTitle, timeInterval, restrictedArr, shop)
    console.log("ranked in cron", obj)
  }
  catch(err){
    console.log(err)
  }
}

const runCron = async () => {
  console.log('\n RUNNING CRON \n')
  try{
    console.log('inside try')
    const allRankedCollections = await db.query(`SELECT * FROM collections`)
    console.log('cron collections', allRankedCollections)

    allRankedCollections.forEach(async collection => {
      let collectionId = collection.collection_id
      let timeInterval = collection.time_range
      let smartCollection = collection.smart_collection
      let collectionTitle = collection.collection_name
      let restore = collection.restore
      let shop = collection.shop

      let auth = await userAuth.getUser(shop);
      let config = {
        headers: { 'X-Shopify-Access-Token': auth.access_token }
      }
      console.log('inside for each')
      // grab dbRestrictedArr
      const queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
      const dbRestrictedArr = await db.query(queryText, [collectionId])
      const restrictedArr = dbRestrictedArr.length > 0 ? dbRestrictedArr.map( item => item.product_id) : []
      console.log(restrictedArr)

      if (restore) {

        if (smartCollection) {
          await cronRestoredSmart(collectionId, smartCollection, collectionTitle, timeInterval, shop)
        }else{
          await cronRestoredCustom(restrictedArr, collectionId, smartCollection, collectionTitle, timeInterval, shop, auth.access_token)
        }
        // change restore back to false
        const restoreQuery = 'UPDATE collections SET restore = ($1) WHERE collection_id = ($2) RETURNING *'
        const restoreResult = await db.query(restoreQuery, [false, collectionId])
      }
      else {
        // call rank normally (know if smart or not, know existing for sure)
        console.log('\n CRON RANKING \n')
        await cronNormal(restrictedArr, collectionId, smartCollection, collectionTitle, timeInterval, shop)
      }
    });
  }
  catch(err){
    console.log(err)
    throw err
  }
}

cron.schedule('0 4 * * *', async () => {
  runCron()
}, {
  scheduled: true,
  timezone: "Asia/Tokyo"
});
