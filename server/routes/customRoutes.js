const ShopifyAPIClient = require("shopify-api-node");
const functions = require('../functions');
const db = require('../../db')
const router = require('koa-router')();
const koaBody = require('koa-body');

// > const authDetails = await getUser()
// > console.log(authDetails)
// { id: 2,
//   shop: 'kabir-test.myshopify.com',
//   access_token: '1',
//   origin: 'Wed, 15 May 2019 09:02:20 GMT' }

const getUser = async () => { 
  try {
    const shop = await db.query(`SELECT * FROM my_user`);
    return shop[0]
  } catch(err) {
    console.log(err)
  }
}


module.exports = (router) => {
  router
    .get("/customSearch", (ctx, next) => {
      // remember to add /api and /:shop
      // SQL query
      const startWeek = ctx.query.startWeek
      const endWeek = ctx.query.endWeek
      functions.customProductRank(startWeek, endWeek)
      ctx.response.status = 200
    })
    .post("/rankProducts", koaBody(), async ctx => { // need to add api for the shopify auth call
      // call getUser
      // const {shop, accessToken} = ctx.session;
      const body = JSON.parse(ctx.request.body)
      const {startDate, endDate, type} = body
      const result = await db.query(`SELECT * FROM orders_products WHERE ${type} BETWEEN ${startDate} AND ${endDate}`)
      // do stuff
      // need to check restrict product ids
      // send back ranking (in order) product ids

      console.log(result)
      ctx.body = {
        "sorted_ranked_product_ids": ["10293020", "11838929", "19392929"]
      }
    })
    .post("/newSaveCollection", koaBody(), async ctx => { // NEW COLLECTION
      // {collectionId, collectionName, timeRange, products}
      // possible time range values: 7, 30, 90, 180
      try {
        const body = JSON.parse(ctx.request.body)
        console.log(body)
        const {collectionId, collectionName, timeRange} = body
        const queryText = 'INSERT INTO collections (collection_id, collection_name, time_range, restore) VALUES($1, $2, $3, $4) RETURNING *'
        const result = await db.query(queryText, [collectionId, collectionName, timeRange, false])
        console.log(result)
        ctx.body = result
      }catch(err) {
        ctx.body = err
      }
    })
    .put("/updateCollection", koaBody(), async ctx => { // NEW COLLECTION
      // {collectionId, collectionName, timeRange}
      // possible time range values: 7, 30, 90, 180
      try {
        const body = JSON.parse(ctx.request.body)
        console.log(body)
        const {collectionId, collectionName, timeRange, restore = false} = body
        const queryText = 'UPDATE collections SET collection_name = ($2), time_range = ($3), restore = ($4)  WHERE collection_id = ($1) RETURNING *'
        const result = await db.query(queryText, [collectionId, collectionName, timeRange, restore])
        console.log(result)
        ctx.body = result
      }catch(err) {
        ctx.body = err
      }
    })
    .get("/getAllRankedCollections", async ctx => {
      //get all ranked collections
      try {
        console.log("getall ranked")
        const result = await db.query(`SELECT * FROM collections`)
        console.log(result)
        ctx.body = result
        result ? ctx.response.status = 200 : ctx.response.status = 418
      }catch(err) {
        ctx.body = err
      }

    })
    .post("/restrictProducts", koaBody(), async ctx => {
      // {collection_id, [id1, id2, id3]}
      try {
        console.log("restrict products")
        const body = JSON.parse(ctx.request.body)
        console.log(body)
        const {collectionId, restrictedProductArr} = body
        const queryText = 'INSERT INTO restricted_items (collection_id, product_id) VALUES($1, $2) RETURNING *'
        const result = await Promise.all(restrictedProductArr.map( async productId => {
          let res = await db.query(queryText, [collectionId, productId])
          console.log(res)
          return res
        }))
        console.log(result)
        ctx.body = result

      }catch(err) {
        ctx.body = err
      }
    })
    .post("/restoreRestricedProducts", koaBody(), async ctx => {
      // {collection_id}
      // change restore boolean
      try {
        const body = JSON.parse(ctx.request.body)
        console.log(body)
        const {collectionId} = body
        const restoreQuery = 'UPDATE collections SET restore = ($1) WHERE collection_id = ($2) RETURNING *'
        const restoreResult = await db.query(restoreQuery, [true, collectionId])
        console.log(restoreResult)
        ctx.body = restoreResult
      } catch(err) {
        ctx.body = err
      }
    })
    .post("/stopWatchingCollection", koaBody(), async ctx => {
      // {collection_id}
      // delete collection from tables (2 tables)
      try {
        const body = JSON.parse(ctx.request.body)
        console.log(body)
        const {collectionId} = body
        const collectionQuery = 'DELETE FROM collections WHERE collection_id = ($1) RETURNING *'
        const itemQuery = 'DELETE FROM restricted_items WHERE collection_id = ($1) RETURNING *'
        const collectionResult = await db.query(collectionQuery, [collectionId])
        const itemResult = await db.query(itemQuery, [collectionId])
        const result = await Promise.all([collectionResult, itemResult])
        console.log(result)
        ctx.body = result
      }catch(err) {
        ctx.body = err
      }
    })
    // in POST for actual ranking remember to check restricted products
    .get("/api/installation", (ctx, next) => {
      const {shop, accessToken} = ctx.session;
      const shopify = new ShopifyAPIClient({
        shopName: shop,
        accessToken: accessToken,
      });
      shopify.scriptTag
        .create({
          event: "onload",
          src: "https://cdn.jsdelivr.net/npm/riot@3.13/riot.min.js",
        })
        .then(
          (response) => {
            console.log(`scriptTag created`);
            next();
          },
          (err) => {
            console.log(
              `Error creating scriptTag. ${JSON.stringify(err.response.body)}`,
            );
          },
        );
    });
};
