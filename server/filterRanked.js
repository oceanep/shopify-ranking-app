const db = require('./db')
const axios = require('axios');

const delete_from_shopify_collection = async (collectionId, productIdArr, shop, accessToken) => {
    const gqlProductArr = productIdArr.map( item => `gid://shopify/Product/${item.productId}`)
    console.log("gql arr", gqlProductArr)
    console.log(accessToken)
    try{
      const res = await axios({
          url: `https://${shop}/admin/api/graphql.json`,
          method: 'post',
          headers: { 'X-Shopify-Access-Token': accessToken },
          data: {
              query: `
                mutation collectionRemoveProducts($id:ID!, $productIds:[ID!]!){
                  collectionRemoveProducts(id: $id, productIds: $productIds) {
                      job {
                        id
                      }
                      userErrors {
                        field
                        message
                      }
                    }
                }
              `,
              variables: {
                id: `gid://shopify/Collection/${collectionId}`,
                productIds: gqlProductArr
              }
          }
        })
      if (res.data.errors) throw res.data.errors
    }
    catch(err){
      console.log(err)
    }
}

const filterRanked = (sortedArr, restrictedArr) => {
  const finalArr = sortedArr.filter(function(item) {
      return restrictedArr.length > 0 ? !restrictedArr.includes(item.productId.toString()) : item.productId.toString();
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
    filterCustomCollection: async (collectionId, sortedArr, restrictedArr=[], shop, accessToken='', isNew = false) => {
      //sorted not including past restricted but including current restricted
      //filter current restricted
      const filterRes = filterRanked(sortedArr, restrictedArr)
      //and delete current restricted
      //compare sortedArr to all restrictedArr, delete products from sortedArr that are still in restrictedArr from shopify
      const toDeleteArr = restrictedArr.length > 0 ? sortedArr.filter( item => {
          console.log('\n\n\n CHECKING DELETES', item.productId)
          return restrictedArr.includes(item.productId.toString());
      }) : []
      console.log('\n\n IS IT NEW', toDeleteArr.length, isNew)
      console.log('\n\n TODELETE ARRAY', toDeleteArr)
      if ((toDeleteArr.length > 0) && (!isNew)) {await delete_from_shopify_collection(collectionId, toDeleteArr, shop, accessToken)}

      return filterRes.finalArr
    }
}
