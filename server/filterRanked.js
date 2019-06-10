const db = require('./db')
const axios = require('axios');

const delete_from_shopify_collection = async (collectionId, productIdArr, accessToken) => {
    const gqlProductArr = await productIdArr.map(id => `gid://shopify/Product/${id}`)
    console.log("gql arr", gqlProductArr)
    console.log(accessToken)
    try{
      const res = await axios({
          url: `https://product-ranking.herokuapp.com/admin/api/graphql.json`,
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
    catch(err){
      console.log(err)
      throw err
    }
}

const filterRanked = (sortedArr, restrictedArr) => {
  const finalArr = sortedArr.filter(function(item) {
      return !restrictedArr.includes(item.productId.toString());
  })

  return {
    finalArr: finalArr.map(x => x.productId.toString()),
    restrictedArr: restrictedArr
  }
}

module.exports = {
    filterSmartCollection: async (collectionId, sortedArr, restrictedArr=[]) => {
      //sorted always includes all restricted
      //concat old restricted and new restricted
      // let queryText = 'SELECT product_id FROM restricted_items WHERE collection_id = ($1)'
      // let restrictedResult = await db.query(queryText, [collectionId])
      // console.log(restrictedResult)
      // const dbRestrictedArr = restrictedResult.length > 0 ? restrictedResult.map(x => x.product_id) : []
      // const fullRestrictedArr = dbRestrictedArr.length > 0 ? restrictedArr.concat(dbRestrictedArr) : restrictedArr

      //filter combo restricted
      const filterRes = filterRanked(sortedArr, restrictedArr)
      console.log('filtered array length: ', filterRes.finalArr.length)
      console.log('filterSmartCollection filterRes', filterRes)

      //concat combo restricted to bottom
      const finalArr = filterRes.finalArr.concat(filterRes.restrictedArr)
      console.log('final array length: ', finalArr.length)
      console.log('filterSmartCollection finalArr', finalArr)
      return finalArr
    },
    filterCustomCollection: async (collectionId, sortedArr, restrictedArr=[], accessToken='') => {
      //sorted not including past restricted but including current restricted
      //filter current restricted
      const filterRes = filterRanked(sortedArr, restrictedArr)
      //and delete current restricted
      //compare sortedArr to all restrictedArr, delete products from sortedArr that are still in restrictedArr from shopify
      const toDeleteArr = sortedArr.filter( (item) => {
          return restrictedArr.includes(item.productId);
      })
      if (toDeleteArr.length > 0) await delete_from_shopify_collection(collectionId, toDeleteArr, accessToken)

      return filterRes.finalArr
    }
}
