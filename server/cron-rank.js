const db = require('./db')
const cron = require('node-cron');
const rank = require('./ranking')
const userAuth = require('./getUser')
const axios = require('axios');

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
    let sortedArr = await rank.productRank(collectionId, timeInterval)
    console.log(`sortedArr ${sortedArr} for collection ${collectionId}`)
    if (smartCollection) {
      // change sort order to manual
      let result = sortedArr.map(x => x.productId);
      await axios({
        method: 'put',
        url: `https://${auth.shop}/admin/api/2019-04/smart_collections/${collectionId}/order.json`,
        data: {
          "products": result
        },
        auth: {
          username: appUsername,
          password: appPassword
      }
      })
        .then(function (message) {
          console.log("smart collection updated");
        })
        .catch(function (error) {
          console.log("smart collection error");
        });

    } else { // custom collection
      const putArr = sortedArr.map(item => {
        return {
          "product_id": +item.productId,
          "position": +item.rank
        };
      });
      console.log(putArr)
      let collectionObj = {
        "custom_collection": {
          "id": +collectionId,
          "collects": putArr
        }
      }
      console.log(collectionObj)
      await axios({
        method: 'put',
        url: `https://${auth.shop}/admin/api/2019-04/custom_collections/${collectionId}.json`,
        data: collectionObj,
        auth: {
          username: appUsername,
          password: appPassword
      }
      })
        .then(function (message) {
          console.log("custom collection updated");
        })
        .catch(function (error) {
          console.log("custom collection error");
        });
    }
  });

}, {
  scheduled: true, 
  timezone: "Asia/Tokyo"
});