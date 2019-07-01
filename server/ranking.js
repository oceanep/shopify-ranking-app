//Ranking Algorithim
const dateFunctions = require('./dateFunctions')
const moment = require('moment')
const db = require('./db')
const userAuth = require('./getUser')
const axios = require('axios');
const filter = require('./filterRanked')

const bottomProducts = async (collectionId) => {
  let queryText = 'SELECT * FROM restricted_items WHERE collection_id = ($1)'
  let result = await db.query(queryText, [collectionId])
  console.log("result", result)
  let toConcat = result.map(obj => ({
    productId: obj.product_id,
    rank: -1
  }))
  return toConcat
}

const mapCustomCollects = async (collects) => {
  const collectsArr = collects.map( collect => ({ productId: collect.product_id, id: collect.id}))
  console.log(collectsArr)

  return collectsArr
}

const handleNewSmartCollection = async (collectionId, sortedArr, restrictedArr, timeInterval, newTitle, ruleSet, shop) =>{
    let smartRules = ruleSet
    let appliedDisjunctively = smartRules.appliedDisjunctively
    let rules = smartRules.rules
    console.log('ruleset ', ruleSet)

    console.log("new smart collection\n")
    console.log("collectionID, sortedArr, restrictedArr", collectionId, sortedArr, restrictedArr)
    let filteredArr = await filter.filterSmartCollection(collectionId, sortedArr, restrictedArr)
    // convert to int
    let intFilteredArr = filteredArr.map( id => parseInt(id))
    // create new smart collection
    console.log("after filtered", smartRules, shop.shop, shop.access_token)

    let createResult = await axios({
      method: 'post',
      url: `https://${shop.shop}/admin/api/2019-04/graphql.json`,
      data: {
        query: `
          mutation collectionCreate($newTitle:String!, $appliedDisjunctively:Boolean!, $rules:[CollectionRuleInput!]){
            collectionCreate(input: {
                title: $newTitle
                templateSuffix: "ranking"
                ruleSet: {
                  appliedDisjunctively: $appliedDisjunctively
                  rules: $rules
                }
              }
            )
            {
              userErrors{
                field
                message
              }
              collection{
                id
                title
              }
            }
          }
        `,
        variables: {
          newTitle: newTitle,
          //publications: titleresourcePublications.map( publication => { publicationId: publication.node.publication.id }),
          appliedDisjunctively: appliedDisjunctively,
          rules: rules
        }
      },
      headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
    })
    console.log('mutation result', createResult.data.data.collectionCreate.collection.id)

    if (createResult.data.errors) throw "graphql create collection failed"

    const newCollectionId = createResult.data.data.collectionCreate.collection.id.slice(25)
    console.log("created smart collection ", newCollectionId)
    const title = createResult.data.data.collectionCreate.collection.title
    console.log('ordered products array', intFilteredArr)
    // order the smart collection
    //if you send a manual order sort to a smart collection immediately, it will interfere with shopify's default sorting and confuse the sorting
    //wait a calculated amount of time to send the sort to assure the sent sorting is properly applied, this can be removed once shopify updates its
    //smart collection manual sorting for all stores in August
    const waitTime = Math.ceil(filteredArr.length/2) * 100
    console.log('waiting...',waitTime)
    await delay(waitTime)
    console.log('pushing product order')
    let newCollectionResult = await axios({
      method: 'put',
      url: `https://${shop.shop}/admin/api/2019-07/smart_collections/${newCollectionId}/order.json`,
      data: {
        "sort_order": "manual",
        "products": intFilteredArr
      },
      headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
    })
    console.log('new smart Collection ordering',newCollectionResult.data)

    return {
      newCollectionId: newCollectionId,
      title: title,
      smartCollection: true,
      new: true,
      timeInterval: timeInterval,
      restrictedArr: restrictedArr
    }
}

const handleNewCustomCollection = async (collectionId, sortedArr, restrictedArr, timeInterval, newTitle, shop) => {
  console.log("new custom collection")

  //needs to delete restricted after creation
  let filteredArr = await filter.filterCustomCollection(collectionId, sortedArr, restrictedArr, shop.shop, shop.access_token, true)
  console.log('handle new custom, filtered', filteredArr)

  let collects = filteredArr.map((id, i) => {
    return {
      product_id: parseInt(id),
      position: +i + 1
    }
  })
  console.log("collects", collects)
  let dataObj = {
    "custom_collection": {
      "title": newTitle,
      "template_suffix": "ranking",
      "sort_order": "manual",
      "collects": collects
    }
  }
  let createCustomCollection = await axios({
    method: 'post',
    url: `https://${shop.shop}/admin/api/2019-04/custom_collections.json`,
    data: dataObj,
    headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
  })
  console.log('new custom collection', createCustomCollection.data)

  const newCollectionId = createCustomCollection.data.custom_collection.id
  const title = createCustomCollection.data.custom_collection.title

  return {
    newCollectionId: newCollectionId,
    title: title,
    smartCollection: false,
    new: true,
    timeInterval: timeInterval,
    restrictedArr: restrictedArr
  }

}

const handleExistingSmartCollection = async (collectionId, sortedArr, restrictedArr, newTitle, shop) => {
  try{
    console.log("existing smart collection")

    //pass in restrictedArr
    let filteredArr = await filter.filterSmartCollection(collectionId, sortedArr, restrictedArr)
    console.log("filteredArr", filteredArr)
    //convert to int
    let intFilteredArr = filteredArr.map( id => parseInt(id))


    console.log("filteredArr", intFilteredArr)
    let titleResult = await axios({
      method: 'put',
      url: `https://${shop.shop}/admin/api/2019-07/smart_collections/${collectionId}.json`,
      data: {
        "smart_collection": {
          "title": newTitle,
          "handle": newTitle
        }
      },
      headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
    })
    let orderResult = await axios({
      method: 'put',
      url: `https://${shop.shop}/admin/api/2019-07/smart_collections/${collectionId}/order.json`,
      data: {
        "sort_order": "manual",
        "products": intFilteredArr
      },
      headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
    })
    console.log("new title, order result", titleResult.data.smart_collection.title, orderResult.data)
    return {
      collectionId: titleResult.data.smart_collection.id,
      title: titleResult.data.smart_collection.title,
      smartCollection: true,
      new: false,
      restrictedArr: restrictedArr
    }
  }
  catch(err){
    console.log(err)
  }
}

const handleExistingCustomCollection = async (collectionId, allCollects, sortedArr, restrictedArr, newTitle, shop) => {
  try{
    console.log("existing custom collection")
    let filteredArr = await filter.filterCustomCollection(collectionId, sortedArr, restrictedArr, shop.shop, shop.access_token)
    console.log(filteredArr)


    //get collects and map special id to product id
    const finalArr = filteredArr.map( item => {
        let val = allCollects.find(e => {
            console.log(e.product_id, item)
            return e.product_id == parseInt(item)
        });
        console.log("\n\n\n VAL \n\n\n", val.id)
        return val.id
    })

    let collects = finalArr.map((id, i) => {
      return {
        id: parseInt(id),
        position: +i + 1
      }
    })
    console.log("collects to send", collects)
    let dataObj = {
      "custom_collection": {
        "title": newTitle,
        "handle": newTitle,
        "sort_order": "manual",
        "collects": collects
      }
    }
    let updatedCollection = await axios({
      method: 'put',
      url: `https://${shop.shop}/admin/api/2019-04/custom_collections/${collectionId}.json`,
      data: dataObj,
      headers: { 'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
    })

    return {
      newCollectionId: updatedCollection.data.custom_collection.id,
      title: updatedCollection.data.custom_collection.title,
      smartCollection: false,
      new: false,
      restrictedArr: restrictedArr
    }
  }
  catch(err){
    console.log(err)
  }
}

const delay = (duration) =>
  new Promise(resolve => setTimeout(resolve, duration));

module.exports = {
  productRank: async (collectionId, smartCollection, ruleSet, collectionTitle, timeInterval, restrictedArr) => { // needs to take what is being POSTed
      try{
        console.log("product rank\n")
        console.log(`id: ${collectionId}, smart?: ${smartCollection}, rules: ${ruleSet}, title: ${collectionTitle}, time: ${timeInterval} \n`)
        //  get shop
        const shop = await userAuth.getUser();
        const appUsername = shop.app_username
        const appPassword = shop.app_password
        console.log(shop)
        const config = {
          headers: {'X-Shopify-Access-Token': shop.access_token, 'Content-Type': 'application/json' }
        }
        const url = `https://${shop.shop}/admin/api/2019-04/collects.json?collection_id=${collectionId}&limit=250`
        // const url = `https://kabir-test.myshopify.com/admin/api/2019-04/smart_collections/101723930691.json`
        //  query shopify
        const res = await axios.get(url, config) //collection data.collects[].productId
        const allCollects = res.data.collects
        console.log('all collects array length: ', allCollects.length)

        console.log("type", res.data)
        const now = moment.utc(new Date())
        console.log('now', now)
        const start = dateFunctions.timeIntervalMoment(timeInterval, now)
        console.log('start, now',start, now)
        const startDay = await dateFunctions.dayCalc(start)
        const endDay = await dateFunctions.dayCalc(now)
        console.log(`\nStartDay ${startDay} EndDay ${endDay}`)
        console.log(startDay)

        //query database for count of each products returned from collection query
        const arr = await Promise.all(res.data.collects.map( async collect => {
          let id = collect.product_id.toString()
          let queryText = 'SELECT COUNT(*) FROM order_product_data WHERE (product_id = ($1)) AND (day BETWEEN ($2::int) and ($3::int))'
          let result = await db.query(queryText, [id, startDay, endDay])
          console.log("result", result)
          return { productId: collect.product_id, rank: result[0].count}
        }))

        //sort count array by count in reverse
        const sortedArr = arr.sort((a,b) => ( +b.rank - +a.rank))
        console.log('sorted array length: ', sortedArr.length)

        let collectionQueryText = 'SELECT * FROM collections WHERE collection_id = ($1)'
        let collectionResult = await db.query(collectionQueryText, [collectionId])
        console.log("collection result", collectionResult)

        // set new name of collection
        let newTitle = `RANKING - ${collectionTitle}`
        let isNewCollection = collectionResult.length === 0 ? true : false

        if (isNewCollection) {
          let newTitle = `RANKING - ${collectionTitle}`

          if (smartCollection) { //if is smart Collection
            return await handleNewSmartCollection(collectionId, sortedArr, restrictedArr, timeInterval, newTitle, ruleSet, shop)
          } else { //if is custom Collection
            return await handleNewCustomCollection(collectionId, sortedArr, restrictedArr, timeInterval, newTitle, shop)
          }
        }

        if (!isNewCollection) {
          let newTitle = collectionTitle
          if (collectionResult[0].smart_collection) { // if smart collection
            return await handleExistingSmartCollection(collectionId, sortedArr, restrictedArr, newTitle, shop)
          } else { // if custom
            return await handleExistingCustomCollection(collectionId, allCollects, sortedArr, restrictedArr, newTitle, shop)
          }
        }

      }catch(err){
        throw err
      }
    }
}
