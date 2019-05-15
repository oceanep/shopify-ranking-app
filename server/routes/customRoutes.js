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
      // products
      const body = JSON.parse(ctx.request.body)
      console.log(body)
      const {collectionId, collectionName, timeRange} = body 
      const queryText = 'INSERT INTO collections (collection_id, collection_name, time_range, restore) VALUES($1, $2, $3, $4) RETURNING *'
      const result = await db.query(queryText, [collectionId, collectionName, timeRange, false])
      console.log(result)
    })
    .put("/upDateSaveCollection", koaBody(), async ctx => { // NEW COLLECTION
      // {collectionId, collectionName, name, timeRange}
      // possible time range values: 7, 30, 90, 180
    })
    .get("/getAllRankedCollections", async ctx => {
      console.log("getall ranked")
      const result = await db.query(`SELECT * FROM collections`)
      console.log(result)
      result ? ctx.response.status = 200 : ctx.response.status = 418
    })
    .post("/restrictProducts", koaBody(), ctx => {
      // {collection_id, [id1, id2, id3]}
      const body = JSON.parse(ctx.request.body)
      console.log(body)
      const {collectionId, restrictedProductArr} = body
      const queryText = 'INSERT INTO restricted_items (collection_id, product_id) VALUES($1, $2) RETURNING *'
      restrictedProductArr.forEach(async productId => {
        const result = await db.query(queryText, [collectionId, productId])
        console.log(result)
      });
    })
    .post("/restoreRestricedProducts", koaBody(), ctx => {
      // {collection_id}
      // change restore boolean
    })
    .post("/stopWatchingCollection", koaBody(), ctx => {
      // {collection_id}
      // delete collection from tables (2 tables)
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
