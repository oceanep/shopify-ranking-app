const ShopifyAPIClient = require("shopify-api-node");
const functions = require('../functions');

module.exports = (router) => {
  router
    .get("/customSearch", (ctx, next) => {
      // remember to add /api and /:shop
      const startWeek = ctx.query.startWeek
      const endWeek = ctx.query.endWeek
      functions.customProductRank(startWeek, endWeek)
      ctx.response.status = 200
    })
    // GET one month 
    // GET three months 
    // etc.
    .get("/hello", (ctx, next) => {
      const {views, shop} = ctx.session;
      var n = views || 0;
      ctx.session.views = ++n;
      if (n === 1) ctx.body = "Welcome here for the first time!";
      else ctx.body = "You've visited this " + shop + " " + n + " times!";
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
