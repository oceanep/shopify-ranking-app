const ShopifyAPIClient = require("shopify-api-node");
const functions = require('../functions');
const db = require('../../db')
const router = require('koa-router')();
const koaBody = require('koa-body');

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
      // const {shop, accessToken} = ctx.session;
      const body = JSON.parse(ctx.request.body)
      const {startDate, endDate, type} = body
      const result = await db.query(`SELECT * FROM orders_products WHERE ${type} BETWEEN ${startDate} AND ${endDate}`) 
      // do stuff 
      // send back ranking (in order) product ids

      console.log(result)
      ctx.body = {
        "sorted_ranked_product_ids": ["10293020", "11838929", "19392929"]
      }
    })
    // need to figure out how to query the database for custom search, one month, three months, etc.
    // GET one month -> SQL query 
    // GET three months -> SQL query 
    .get("/hello", async (ctx, next) => {
      const {views, shop} = ctx.session;
      var n = views || 0;
      ctx.session.views = ++n;
      if (n === 1) ctx.body = "Welcome here for the first time!";
      else ctx.body = "You've visited this " + shop + " " + n + " times!";
      const values = ['00001', 'ppppx', 1, 3, '2019-01-01T00:00:02']
      const queryText = 'INSERT INTO orders_products(order_id, product_id, month, week, created_at) VALUES($1, $2, $3, $4, $5)'
      await db.query(queryText, ['00001', 'ppppx', 1, 3, '2019-01-01T00:00:02'], () => {console.log("here")})
    })
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
