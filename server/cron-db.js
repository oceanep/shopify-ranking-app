// use moment to pass UTC date for lastSyncDate

cron.schedule('0 4 * * *', (dateString) => {
  console.log('build database cron');
  // call build database again but only for one day
}, {
    scheduled: true, 
    timezone: "Asia/Tokyo"
  });