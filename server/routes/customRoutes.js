const ShopifyAPIClient = require("shopify-api-node");
const functions = require('../functions');
const db = require('../../db')

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
    .get("/buildDatabase", async ctx => {
      // console.log("buildDatabase", ctx.session)
      const {shop, accessToken} = ctx.session;
      console.log(shop, accessToken)
      ctx.response.status = 200
      // functions.buildDatabase(shop, accessToken)
    })
    // GET one month -> SQL query 
    // GET three months -> SQL query 
    // etc.
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
