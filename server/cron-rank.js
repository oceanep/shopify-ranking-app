const db = require('../db')
const rank = require('./ranking')

cron.schedule('0 4 * * *', async () => {

  // pull everything from collection table 
  const allRankedCollections = await db.query(`SELECT * FROM collections`)
  allRankedCollections.forEach(async collection => {
    let collectionId = collection.collection_id
    let timeInterval = collection.time_range
    let sortedArr = await rank.productRank(collectionId, timeInterval)
    console.log(`sortedArr ${sortedArr} for collection ${collectionId}`)
    // run series of shopify api calls to update ranked collection
    
  });


}, {
  scheduled: true, 
  timezone: "Asia/Tokyo"
});