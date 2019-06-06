const db = require('./db')
const axios = require('axios');

const delete_from_shopify_collection = async (collectionId, productIdArr, accessToken) => {
    const gqlProductArr = await productIdArr.map(id => `gid://shopify/Product/${id}`)
    console.log("gql arr", gqlProductArr)
    console.log(accessToken)
    const res = await axios({
        url: `https://kabir-test.myshopify.com/admin/api/graphql.json`,
        method: 'post',
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: {
            query: `
              mutation {
                collectionRemoveProducts(id: "gid://shopify/Collection/${collectionId}", productIds: ${gqlProductArr}) {
                    job {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
              }
            `
        }
      })
    return res.data
}

module.exports = {
    filterRanked: async (collectionId, sortedArr, restrictedArr=[], existingCustom=false, accessToken='') => {
    let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
    let restrictedResult = await db.query(queryText, [collectionId])

    // if doesnt exist
    //    is smart
    //      filter and push to bottom
    //    is custom
    //      delete, don't filter
    

    if (existingCustom) {
        const comboArr = restrictedArr.concat(restrictedResult)
        console.log("combo arr", comboArr)
        if (comboArr.length !== 0) {
            const job = await delete_from_shopify_collection(collectionId, comboArr, accessToken)
            console.log(job)
        }

        // filter and send back ranked array
        const restrictedProducts = restrictedResult.map(x => x.product_id)
        const finalArr = sortedArr.filter(function(item) {
            return !restrictedProducts.includes(item.rank);
        })
        return finalArr
    }

    if (restrictedResult.length !== 0) { // restricted product array exists (collection exists)
        const filtered = sortedArr.filter(function(item) {
            let val = restrictedResult.find(e => {
                console.log("iteration", e.product_id, item.productId, e.product_id == item.productId)
                return e.product_id == item.productId
            });
            console.log("val", val)
            return val === undefined

        })

        console.log("FILTERED", filtered)
        return filtered
    } else {
        if (restrictedArr.length !== 0) { // is restricted arr, new ranked collection

            const finalArr = sortedArr.filter(function(item) {
                let val = restrictedArr.find(e => {
                    return e == item.productId
                });
                return item.productId == val ? false : true
            })
            return finalArr
        } else { // have restrictedArr
            // if restrictedArr, delete using those (just replace result with restrictedArr) filter using restrictedArr function
            const restrictedProducts = restrictedResult.map(x => x.product_id)
            const finalArr = sortedArr.filter(function(item) {
                return !restrictedProducts.includes(item.rank);
            })
            // if exists custom collection, delete every product from shopify (call external function)
            return finalArr




        }

        }
    }

}
