const db = require('../db')

module.exports = {
    filterRanked: async (collectionId, sortedArr) => {
    let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
    let result = await db.query(queryText, [collectionId])
    console.log("filterRanked result", result)
    const restrictedProducts = result.map(x => x.product_id)
    const finalArr = sortedArr.filter(function(item) {
        return !restrictedProducts.includes(item.rank); 
    })
    return finalArr
    }
}

