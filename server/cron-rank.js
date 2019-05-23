

cron.schedule('0 4 * * *', () => {

  // re rank on cron job 
  // two types of re-rank (smart, manual)
  // cron job only UPDATES collections (does not create new ones)
  // for all ranked collections 
  // pull from collections table the collection id and time range
  // call the ranking function on each one 
  // somehow do the shopify calls to re rank the collections 

  // if collection has restore false
  // query restricted products for that collection
  // filter sortedArr using those products

}, {
  scheduled: true, 
  timezone: "Asia/Tokyo"
});