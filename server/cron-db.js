const cron = require('node-cron');
const moment = require('moment');
const userAuth = require('./getUser')
const functions = require('./functions');
const db = require('./db')

cron.schedule('0 4 * * *', async () => {
  console.log('build database cron');
  const auth = await userAuth.getUser();
  let shop = auth.shop
  let accessToken = auth.access_token
  let lastSyncDate = auth.last_sync_date
  // build database from lastSyncDate 
  await functions.buildDatabase(shop, accessToken, lastSyncDate)
  // update lastSyncDate
  let momentSync = moment.utc(new Date())
  let newSyncDate = momentSync.format()
  const queryText = 'UPDATE my_user SET last_sync_date = ($1) RETURNING *'
  const insertResult = await db.query(queryText, [newSyncDate])
  console.log("insertResult", insertResult)
}, {
    scheduled: true, 
    timezone: "Asia/Tokyo"
  });