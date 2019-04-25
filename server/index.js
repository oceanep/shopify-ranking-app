import dotenv from "dotenv";
import Koa from "koa";
var serve = require("koa-static");
import mount from "koa-mount";
import views from "koa-views";
import path from "path";
import session from "koa-session";
import koaWebpack from "koa-webpack";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import shopifyAuth, {verifyRequest} from "@shopify/koa-shopify-auth";
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
import webpack from "webpack";
import proxy from "@shopify/koa-shopify-graphql-proxy";
const ShopifyAPIClient = require("shopify-api-node");
import webhookVerification from "../middleware/webhookVerification";
const db = require('../db')
const functions = require('./functions');
import appProxy from "../middleware/appProxy";
dotenv.config();

const {
  SHOPIFY_SECRET,
  SHOPIFY_API_KEY,
  NODE_ENV
} = process.env;
console.log("env variable", SHOPIFY_API_KEY, SHOPIFY_SECRET)
// const queryText = 'INSERT INTO orders_products (order_id, product_id, month, week, created_at) VALUES($1, $2, $3, $4, $5) RETURNING *'
// db.query(queryText, ['00001', 'ppppx', 1, 3, '2019-01-01T00:00:02'])

/* todo: add any database you want.

const { Pool, Client } = require('pg')
const connectionString = 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb'

const pool = new Pool({
  connectionString: connectionString,
})

pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})

const client = new Client({
  connectionString: connectionString,
})
client.connect()

client.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  client.end()
})

*/

const registerWebhook = function(shopDomain, accessToken, webhook) {
  const shopify = new ShopifyAPIClient({
    shopName: shopDomain,
    accessToken: accessToken,
  });
  shopify.webhook
    .create(webhook)
    .then(
      (response) => console.log(`webhook '${webhook.topic}' created`),
      (err) =>
        console.log(
          `Error creating webhook '${webhook.topic}'. ${JSON.stringify(
            err.response.body,
          )}`,
        ),
    );
};
const app = new Koa();
const isDev = NODE_ENV !== "production";
app.use(views(path.join(__dirname, "views"), {extension: "ejs"}));
app.keys = [SHOPIFY_SECRET];
app.use(session(app));
app.use(bodyParser());
const router = Router();
console.log(SHOPIFY_API_KEY)
// app.use(
//   shopifyAuth({
//     apiKey: SHOPIFY_API_KEY,
//     secret: SHOPIFY_SECRET,
//     scopes: [
//       "write_products",
//       "read_themes",
//       "write_themes",
//       "read_script_tags",
//       "write_script_tags",
//       "read_all_orders"
//     ],
//     afterAuth(ctx) {
//       const {shop, accessToken} = ctx.session;
//       console.log("AFTER AUTH", shop, accessToken)
//       ctx.redirect("/");
//     },
//   }),
// );
app.use(
  createShopifyAuth({
    apiKey: SHOPIFY_API_KEY,
    secret: SHOPIFY_SECRET,
    scopes: ['read_products', 'read_orders'],
    async afterAuth(ctx) {
      const { shop, accessToken } = ctx.session;
      ctx.cookies.set('shopOrigin', shop, { httpOnly: false });
      console.log("AUTH", shop, accessToken)
      functions.buildDatabase(shop, accessToken)
    }
  })
);
app.use((ctx) => {
  const {shop, accessToken} = ctx.session;
  //functions.buildDatabase(shop, accessToken) // undefined undefined
})

app.use(serve(__dirname + "/public"));
if (isDev) {
  const config = require("../webpack.config.js");
  const compiler = webpack(config);
  koaWebpack({compiler}).then((middleware) => {
    app.use(middleware);
  });
} else {
  const staticPath = path.resolve(__dirname, "../");
  app.use(mount("/", serve(staticPath)));
}

router.get("/install", (ctx) => ctx.render("install"));
router.use(["/api"], verifyRequest()); //all requests with /api must be verified.
router.use(["/webhooks"], webhookVerification); //webhook skips verifyRequest but verified with hmac
require("./routes/webhookRoutes")(router);
require("./routes/customRoutes")(router);

app.use(router.routes()).use(router.allowedMethods());
app.use(
  verifyRequest({
    fallbackRoute: "/install",
  }),
);
app.use(proxy());
app.use(async (ctx, next) => {
  await next();
  if (ctx.status === 404) {
    return ctx.render("app", {
      title: "Delete Me",
      apiKey: ctx.session.accessToken,
      shop: ctx.session.shop,
    });
  }
});



export default app;
