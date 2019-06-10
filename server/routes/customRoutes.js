const ShopifyAPIClient = require("shopify-api-node");
const axios = require('axios');
const functions = require('../functions');
const routeHelpers = require('../routeHelpers');
const db = require('../db')
const router = require('koa-router')();
const koaBody = require('koa-body');
const ranking = require('../ranking.js')

module.exports = (router) => {
  router
    .post("/helloWorld", async ctx => {
      console.log('hello')
    })
    .post("/rankProducts", async ctx => {
      console.log("rank products")
      try {
        const body = ctx.request.body
        const {collectionId, smartCollection, ruleSet, collectionTitle, timeInterval, restrictedArr} = body
        console.log('rankProducts body', collectionId, smartCollection, ruleSet, collectionTitle, timeInterval, restrictedArr)
        const res = await ranking.productRank(collectionId, smartCollection, ruleSet, collectionTitle, timeInterval, restrictedArr) // filter happens in here, api call happens here
        // res variable will have POST request result (send back) collectionId, restricted products, timeInterval etc. anything that needs db calls
        // make needed route calls using POST data on frontend {collectionId, restrictedArr, timeInterval}
        // save to collection db (collectionId, collectionName, timeRange, false])
        const final = await routeHelpers.saveNewCollection(res)
        // ctx.body = {collectionId, smartCollection, ruleSet, collectionTitle, timeInterval, restrictedArr}

        ctx.body = final
        ctx.response.status = res.newCollectionId ? 200 : 418
      }
      catch(err){
        console.log("error in rankProducts: ", err)
        ctx.body = err
        ctx.response.status = 418
      }

    })
    .put("/updateCollection", async ctx => {
      // {collectionId, collectionName, timeRange}
      // possible time range values: '7', '30', '90', '180'
      try {
        const body = ctx.request.body
        const {collectionId, smartCollection, timeInterval, restore} = body
        const queryText = 'UPDATE collections SET time_range = ($2), restore = ($3)  WHERE collection_id = ($1) RETURNING *'
        const result = await db.query(queryText, [collectionId, timeInterval, restore])
        console.log("Updated Collection", result)
        ctx.body = result
        ctx.response.status = result.length > 0 ? 200 : 418
      }catch(err) {
        ctx.body = err
      }
    })
    .get("/getAllRankedCollections", async ctx => {
      //get all ranked collections
      try {
        console.log("getall ranked")
        const result = await db.query(`SELECT * FROM collections`)
        const collections = result.map( collection => (
          {
            title: collection.collection_name,
            id: collection.collection_id,
            isSmartCollection: collection.smart_collection,
            timeRange: collection.time_range,
            restore: collection.restore
          }
        ))
        console.log(collections)
        ctx.body = {collections}
        result ? ctx.response.status = 200 : ctx.response.status = 418
      }catch(err) {
        ctx.body = err
      }
    })
    .post("/restrictProducts", async ctx => {
      // {collection_id, [product_id1, product_id2, product_id3]}
      // restrict and delete from shopify
      try {
        console.log("restrict products")
        const body = ctx.request.body
        console.log(body)
        const {collectionId, restrictedProductArr} = body
        if (!restrictedProductArr.length > 0) throw 'no restricted products'
        const queryText = 'INSERT INTO restricted_items (collection_id, product_id) VALUES($1, $2) RETURNING *'
        const result = await Promise.all(restrictedProductArr.map( async productId => {
          let res = await db.query(queryText, [collectionId, productId])
          console.log(res)
          return res
        }))
        console.log(result)
        // delete_from_shopify(collection_id, restrictedProductArr)
        ctx.body = result
        ctx.response.status = result.length > 0 ? 200 : 418
      }catch(err) {
        ctx.body = err
        ctx.response.status = 418
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
    .post("/deleteRankedCollection", async ctx => {
      // {collection_id}
      // delete collection from tables (2 tables)
      try {
        const body = ctx.request.body
        console.log(body)
        const {collectionId} = body
        const collectionQuery = 'DELETE FROM collections WHERE collection_id = ($1) RETURNING *'
        const itemQuery = 'DELETE FROM restricted_items WHERE collection_id = ($1) RETURNING *'
        const collectionResult = await db.query(collectionQuery, [collectionId])
        const itemResult = await db.query(itemQuery, [collectionId])
        const result = await Promise.all([collectionResult, itemResult])
        console.log(result)
        ctx.body = result
        ctx.response.status = result[0].length > 0 ? 200 : 418
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
    })
    // Define middleware routes for shopify api hits from React front endpoint
    .get("/getShopifyProducts/:id", koaBody(), async ctx => {
      const { shop, accessToken } = ctx.session
      const params = ctx.params
      console.log('params',params)
      //get all collection's products
      try {
        console.log("get all collection's products")
        console.log('shop, access', shop, accessToken)
        let res = await axios({
          url: `https://${shop}/admin/api/graphql.json`,
          method: 'post',
          headers: { 'X-Shopify-Access-Token': accessToken },
          data: {
            query: `{
              collection(id: "gid://shopify/Collection/${params.id}") {
                products(first:250){
                  edges{
                    cursor
                    node{
                      id
                      title
                      featuredImage{
                        originalSrc
                      }
                    }
                  }
                }
              }
            }`
          }
        })
        console.log(res.data.data)
        const products = res.data.data.collection.products.edges.map( product => (
          {
            id: product.node.id.slice(22),
            title: product.node.title,
            imgSrc: product.node.featuredImage ? product.node.featuredImage.originalSrc : ''
          }
        ))
        console.log('products',products)
        ctx.body = { products }
        res ? ctx.response.status = 200 : ctx.response.status = 418
      }catch(err) {
        ctx.body = err
      }
    })
    .get("/getShopifyCollections", koaBody(), async ctx => {
      const { shop, accessToken } = ctx.session;
      //get all shopify collections
      try {
        console.log("getall shopify collections")
        console.log('shop, access', shop, accessToken)
        let collectionRes = await routeHelpers.getAllShopifyCollections(shop, accessToken)

        console.log(collectionRes.data)
        //check for errors
        if (collectionRes.data.errors) throw `${collectionRes.data.errors[0].message}`

        const collections = collectionRes.data.data.collections.edges.map( collection => {
          //const publications = await routeHelpers.getCollectionPublications(shop, accessToken, collection.node.id)
          console.log(collection)
          return {
            title: collection.node.title,
            id: collection.node.id.slice(25),
            isSmartCollection: collection.node.ruleSet ? true : false,
            ruleSet: collection.node.ruleSet ? collection.node.ruleSet : null
          }
        })

        ctx.body = {collections}
        collections ? ctx.response.status = 200 : ctx.response.status = 418
      }catch(err) {
        ctx.body = err
        ctx.response.status = 418
      }
    })
    ;
};
