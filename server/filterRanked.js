const db = require('./db')

module.exports = {
    filterRanked: async (collectionId, sortedArr) => {
    let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
    let result = await db.query(queryText, [collectionId])
    if (!result) {
        return sortedArr
    } else {
        const restrictedProducts = result.map(x => x.product_id)
        const finalArr = sortedArr.filter(function(item) {
            return !restrictedProducts.includes(item.rank); 
        })
        // if exists custom collection, delete every product from shopify 
        return finalArr
        }
    }

}

