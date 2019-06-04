const ShopifyAPIClient = require("shopify-api-node");
const axios = require('axios');
const functions = require('../functions');
const db = require('../db')
const router = require('koa-router')();
const koaBody = require('koa-body');
const ranking = require('../ranking.js')

module.exports = (router) => {
  router
    .post("/rankProducts", koaBody(), async ctx => {
      console.log("rank products")
      const body = JSON.parse(ctx.request.body)
      const {collectionId, timeInterval} = body
      const res = await ranking.productRank(collectionId, timeInterval)
      ctx.body = res
    })
    .post("/newSaveCollection", koaBody(), async ctx => {
      // {collectionId, collectionName, timeRange, products}
      // possible time range values: '7', '30', '90', '180'
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
    .put("/updateCollection", koaBody(), async ctx => {
      // {collectionId, collectionName, timeRange}
      // possible time range values: '7', '30', '90', '180'
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
        const collections = result.map( collection => (
          {
            title: collection.collection_name,
            id: collection.collection_id,
            isSmartCollection: collection.smart_collection,
            timeRange: collection.time_range
          }
        ))
        console.log(collections)
        ctx.body = collections
        result ? ctx.response.status = 200 : ctx.response.status = 418
      }catch(err) {
        ctx.body = err
      }
    })
    .post("/isSmartCollection", koaBody(), async ctx => {
      // { collectionId }
      try {
        const body = JSON.parse(ctx.request.body)
        console.log(body)
        const {collectionId} = body
        const queryText = 'SELECT * FROM collections WHERE collection_id = ($1)'
        const result = await db.query(queryText, [collectionId])
        console.log(result)
        ctx.body = result[0].smart_collection
      } catch(err) {
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
            id: product.node.id.slice(23),
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
        let res = await axios({
            url: `https://${shop}/admin/api/graphql.json`,
            method: 'post',
            headers: { 'X-Shopify-Access-Token': accessToken },
            data: {
                query: `{
                  collections(first:250) {
                    edges {
                      cursor
                      node {
                        id
                        title
                        ruleSet{
                            rules{
                              column
                              condition
                              relation
                            }
                          }
                        }
                      }
                      pageInfo {
                      hasNextPage
                    }
                  }
                }`
            }
        })
        console.log(res.data.data)
        const collections = res.data.data.collections.edges.map( collection => (
          {
            title: collection.node.title,
            id: collection.node.id.slice(25),
            isSmartCollection: collection.node.ruleSet ? true : false,
            ruleSet: collection.node.ruleSet ? collection.node.ruleSet.rules : null
          }
        ))
        ctx.body = { collections}
        res ? ctx.response.status = 200 : ctx.response.status = 418
      }catch(err) {
        ctx.body = err
      }
    })
    ;
};
