const userAuth = require('./getUser')
const db = require('./db')
const moment = require('moment');

module.exports = {
    saveNewCollection: async (res) => {
          // {collectionId, collectionName, timeRange, restore}
          const {newCollectionId, title, smartCollection, timeInterval, restrictedArr} = res
          try {
            const queryText = 'INSERT INTO collections (collection_id, collection_name, smart_collection, time_range, restore) VALUES($1, $2, $3, $4, $5) RETURNING *'
            const collectionRes = await db.query(queryText, [newCollectionId, title, smartCollection, timeInterval, false])
            const restrictedQueryText = 'INSERT INTO restricted_items (collection_id, product_id) VALUES($1, $2) RETURNING *'
            const restrictedRes = await Promise.all(restrictedArr.map( async productId => {
              let res = await db.query(restrictedQueryText, [newCollectionId, productId])
              return res
            }))
            console.log("New Collection Inserted", collectionRes)
            console.log("Restricted Items Inserted", restrictedRes)
            return [collectionRes, restrictedRes]
          }catch(err) {
            console.log(err)
          }
        }
}
