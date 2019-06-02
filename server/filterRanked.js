const db = require('./db')

// const delete_from_shopify = () => {}

// if smart, concat db restricted to end

module.exports = {
    filterRanked: async (collectionId, sortedArr, restrictedArr=[]) => {
    let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
    let result = await db.query(queryText, [collectionId])
    
    if (!result) { // no restricted product array
        // if no restricted product array in db, use restrictedArr
        return sortedArr
    } else {
        if (restrictedArr.length !== 0) { // no restricted arr, new ranked collection
            // const restrictedProducts = result.map(x => x.product_id)
            // console.log("restricted arr", restrictedArr)
            const finalArr = sortedArr.filter(function(item) {
                // return !restrictedArr.includes(item); 
                let val = restrictedArr.find(e => {
                    return e == item.productId
                });
                // console.log("item value", item, val)
                // console.log(!item.productId == val)
                return item.productId == val ? false : true
            })
            // if exists custom collection, delete every product from shopify (call external function)
            // console.log("result", finalArr.length !== sortedArr.length)
            return finalArr // restrictedArr looks different {product id: fdsfdsfd, rank:n0} ['1, 2, 3, 4,]
        } else { // have restrictedArr
            // if restrictedArr, delete using those (just replace result with restrictedArr) filter using restrictedArr function
            const restrictedProducts = result.map(x => x.product_id)
            const finalArr = sortedArr.filter(function(item) {
                return !restrictedProducts.includes(item.rank); 
            })
            // if exists custom collection, delete every product from shopify (call external function)
            return finalArr



            
        }

        }
    }

}

