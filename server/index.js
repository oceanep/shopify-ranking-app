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
import { start } from "repl";
const cron = require('node-cron');
const koaBody = require('koa-body');
const parseDate = require('./parseDate');
const moment = require('moment');
const dateFunctions = require('./dateFunctions')
dotenv.config();

const {
  SHOPIFY_SECRET,
  SHOPIFY_API_KEY,
  NODE_ENV
} = process.env;

const app = new Koa();
const isDev = NODE_ENV !== "production";
app.use(views(path.join(__dirname, "views"), {extension: "ejs"}));
app.keys = [SHOPIFY_SECRET];
app.use(session(app));
app.use(bodyParser()); // changed
const router = Router();
console.log(SHOPIFY_API_KEY)
app.use(
  createShopifyAuth({
    apiKey: SHOPIFY_API_KEY,
    secret: SHOPIFY_SECRET,
    accessMode: 'offline',
    scopes: ['read_products', 'read_orders', 'unauthenticated_read_product_listings'],
    async afterAuth(ctx) {

      const { shop, accessToken } = ctx.session;
      console.log("accessToken", accessToken)
      const existingUser = await db.query('SELECT * FROM my_user')
      console.log("existingUser", existingUser)
      console.log("date functions test", dateFunctions.calcuateDaysFromOrigin(moment.utc(new Date())))


      
      if (existingUser.length === 0) {
        let momentObj = moment.utc(new Date())
        let nowString = momentObj.format()
        const queryText = 'INSERT INTO my_user (shop, access_token, origin) VALUES($1, $2, $3) RETURNING *'
        const insertResult = await db.query(queryText, [shop, accessToken, nowString])
        console.log("insertResult", insertResult)
      } else {
        // update auth info 
        const updateQueryText = 'UPDATE my_user SET access_token = $1'
        const updateResult = await db.query(updateQueryText, [accessToken])
        console.log("updateResult", updateResult)
      }

      ctx.cookies.set('shopOrigin', shop, { httpOnly: false });
      console.log("AUTH", shop, accessToken)
      functions.buildDatabase(shop, accessToken, new Date())
      ctx.redirect("/");
    }
  })
);

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
