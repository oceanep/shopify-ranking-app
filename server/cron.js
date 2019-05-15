let date = new Date()
let dateString = date.toUTCString()
console.log(dateString)
cron.schedule('0 */12 * * *', (dateString) => {
  console.log('running cron job');
  // functions.buildDatabase(shop, accessToken, dateString)
  // delete beginning of database
  // need background workers 
});