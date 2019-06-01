const db = require('./db')

// const delete_from_shopify = () => {}

module.exports = {
    filterRanked: async (collectionId, sortedArr, accessToken, shop, exists=false, restrictedArr=[]) => {
    let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
    let result = await db.query(queryText, [collectionId])
    if (!result) {
        return sortedArr
    } else {
        const restrictedProducts = result.map(x => x.product_id)
        const finalArr = sortedArr.filter(function(item) {
            return !restrictedProducts.includes(item.rank); 
        })
        // if exists custom collection, delete every product from shopify (call external function)
        // if restrictedArr, delete using those (just replace result with restrictedArr)
        return finalArr
        }
    }

}

