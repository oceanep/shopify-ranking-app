const axios = require('axios');
const db = require('../db')
const dateFunctions = require('./dateFunctions')
const moment = require('moment');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const lineItemPagination = async (order_id, cursor, dataArray, accessToken, shop) => {
    console.log(`query variables: order id ${order_id}, line item cursor ${cursor}`)
    try {
      console.log('waiting...')
        const res = await axios({
            url: `https://kabir-test.myshopify.com/admin/api/graphql.json`,
            method: 'post',
            headers: { 'X-Shopify-Access-Token': accessToken },
            data: {
                query: `
                    {
                        order(id: "gid://shopify/Order/${order_id}") {
                            createdAt
                            id
                            lineItems(first:1 ${cursor ? `, after:"${cursor}"` : ''} ) {
                                edges {
                                    cursor
                                    node {
                                        product {
                                            id
                                        }
                                    }
                                }
                                pageInfo {
                                    hasNextPage
                                }
                            }
                        }
                    }
                `
            }
        })
        // save product data
        let nextPage = res.data.data.order.lineItems.pageInfo.hasNextPage
        let lineItems = res.data.data.order.lineItems.edges
        let finalIdx = lineItems.length - 1
        let nextCursor = lineItems[finalIdx].cursor

        console.log('\ninside extra item query')

        return dataArray.concat(!nextPage ? lineItems.map( i => i.node.product.id.slice(22)) : await lineItemPagination(order_id, nextCursor, dataArray, accessToken, shop))

    } catch(err) {
        console.log(`failed in lineitems check ${err.stack}`)
    }

}

// 2018-01-01T00:00:01 Z

const ordersQuery = async (shop, accessToken, lastSyncDate, cursor='') => {
  console.log('\nTrying orders Query')
  try {
    let res = await axios({
        url: `https://${shop}/admin/api/graphql.json`,
        method: 'post',
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: {
            query: `
                {
                    orders(first:10, ${cursor ? `after:"${cursor}",` : ''} query:"created_at:>#{${lastSyncDate}}") {
                        edges {
                        cursor
                            node {
                                createdAt
                                id
                                lineItems(first:1) {
                                    edges {
                                        cursor
                                        node {
                                            product {
                                                id
                                            }
                                        }
                                    }
                                    pageInfo {
                                        hasNextPage
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            `
        }
    })
    let ordersArray = res.data.data.orders.edges
    let ordersCursor = res.data.data.orders.edges.cursor
    let ordersPaginate = res.data.data.orders.pageInfo.hasNextPage // boolean

    console.log("ordersPaginate ", ordersPaginate)

    console.log("CURRENT THROTTLE LIMIT", res.data.extensions.cost.throttleStatus.currentlyAvailable)
    if(res.data.extensions.cost.throttleStatus.currentlyAvailable<500){
      let timetowait = Math.round( parseInt(res.data.extensions.cost.requestedQueryCost) / 50)
      console.log(timetowait)
      await sleep(timetowait * 1000)
      console.log("SLEPT")
    }

    if (ordersPaginate) {ordersArray.concat(await ordersQuery(shop, accessToken, lastSyncDate, ordersCursor))}

    return ordersArray

  } catch(err) {
    console.log(`failed in orders check ${err.stack}`)
  }

}

const productQueryBuilder = (obj) => { // take object products, orderID, month, week, createdAt
    console.log("productQueryBuilder")
    const {
        orderId,
        productId,
        days,
        createdAt
    } = obj
    const queryText = 'INSERT INTO order_product_data (order_id, product_id, day, created_at) VALUES($1, $2, $3, $4) RETURNING *'
    db.query(queryText, [orderId, productId, days, createdAt])
  }


module.exports = {

    buildDatabase: async (shop, accessToken, lastSyncDate) => {
        console.log("buildDatabase", shop, accessToken, lastSyncDate)
        try {
            const ordersArray = await ordersQuery(shop, accessToken, lastSyncDate)
            console.log('\nCompleted orders array', ordersArray)

            let final = await ordersArray.reduce( async (acc, order) => {

                let accumulator = await acc

                let orderID = order.node.id.slice(20)
                let orderCreatedAt = order.node.createdAt
                console.log("\nORDER START")
                console.log("orderID", orderID) // add to queryObj
                console.log("orderCreatedAt", orderCreatedAt) // add to queryObj

                let target = moment.utc(orderCreatedAt)
                // get all days from order created at
                let days = await dateFunctions.dayCalc(target)
                console.log("days", days)

                let lineItemsPaginate = order.node.lineItems.pageInfo.hasNextPage; // boolean
                let cursor = order.cursor
                let resArray = order.node.lineItems.edges
                let lineItemCursor = resArray[resArray.length - 1].cursor

                // deal with the first page of line items
                let productIdArray = resArray.map((lineItem) => (lineItem.node.product.id.slice(22)))

                console.log(acc)
                console.log(productIdArray)

                // paginate the remaining line items
                if (lineItemsPaginate) {
                    console.log(`NEXT PAGE ${lineItemsPaginate}`)

                    productIdArray = productIdArray.concat(await lineItemPagination(orderID, lineItemCursor, [], accessToken, shop))
                    console.log("paginated line items ", productIdArray)
                }

                let itemsArray = productIdArray.map( product => (
                {
                    orderId: orderID,
                    productId: product,
                    days: days,
                    createdAt: orderCreatedAt
                }
                ))

                return accumulator.concat(itemsArray)

            }, [])

            console.log("\nFULL QUERY ARRAY\n", final)
            final.forEach(element => {
                productQueryBuilder(element)
            });

        } catch(err) {
            console.log(err.stack)
        }

    }

}
