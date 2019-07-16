const cron = require('node-cron');
const moment = require('moment');
const userAuth = require('./getUser')
const functions = require('./functions');
const db = require('./db')

cron.schedule('0 4 * * *', async () => {
  console.log('build database cron');
  const shops = await userAuth.getAllShops();

  shops.forEach( async shop => {
    let storeName = shop.shop
    let accessToken = shop.access_token
    let lastSyncDate = shop.last_sync_date
    // build database from lastSyncDate
    await functions.buildDatabase(storeName, accessToken, lastSyncDate)
    // update lastSyncDate
    let momentSync = moment.utc(new Date())
    let newSyncDate = momentSync.format()
    const queryText = 'UPDATE my_user SET last_sync_date = ($1) WHERE shop = $2 RETURNING *'
    const insertResult = await db.query(queryText, [newSyncDate, storeName])
    console.log("insertResult", insertResult)
  })

}, {
    scheduled: true,
    timezone: "Asia/Tokyo"
  });
 
