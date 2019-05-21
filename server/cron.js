let date = new Date()
let dateString = date.toUTCString() // so know when last updates
// lastSyncDate is what dateString will be?

cron.schedule('0 */12 * * *', (dateString) => {
  console.log('running cron job');
  // re rank on cron job 
  // two types of re-rank (smart, manual)
  // cron job only UPDATES collections (does not create new ones)
  // for all ranked collections 
  // pull from collections table the collection id and time range
  // call the ranking function on each one 
  // somehow do the shopify calls to re rank the collections 
});