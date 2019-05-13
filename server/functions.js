// import axios to make graphql call
const axios = require('axios');
const db = require('../db')
// import

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const monthCalc = (created_at) => { // created at is target month
    // strip created_at '2019-01-01T00:00:02'
    let targetMonth = parseInt(created_at.slice(5, 8))
    let targetYear = parseInt(created_at.slice(0, 5))
    console.log("target", targetMonth, targetYear)
    if (targetYear !== 2019) {
      //(13 - start month) * year difference + targetMonth
        return 12 * (targetYear - 2019) + targetMonth
    } else {
        return targetMonth  // 1 for January
    }
}

const weekCalc = (created_at) => {
    let minutes = parseInt(created_at.slice(14, 16))
    let hours = parseInt(created_at.slice(12, 14))
    let day = parseInt(created_at.slice(8, 10))
    //js Date object counts months from 0 so subtract 1
    let month = parseInt(created_at.slice(6, 8)) - 1
    let year = parseInt(created_at.slice(0, 5))
    let origin = new Date(Date.UTC(2019, 0, 1))
    let target = new Date(Date.UTC(year, month, day, hours, minutes))
    let diff = target - origin
    let oneDay = 1000 * 60 * 60 * 24
    //2 day offset to calculate for January 1st 2019 being on a Tuesday, 1 to offset for current day
    let days = Math.floor(diff / oneDay) + 3

    let weeks = Math.ceil(parseFloat(days/7))
    console.log('Origin date: ', origin)
    console.log('target year, month, day, hours, minutes: ', year, month, day, hours, minutes)
    console.log(`
        Days since origin: ${days}, Weeks since origin: ${weeks}
      `)

    return weeks

}

const lineItemPagination = async (order_id, cursor, dataArray, accessToken, shop) => {
    // gql query
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
        // edges[0].products.id
        console.log('\ninside extra item query')
        for (const lineItem of res.data.data.order.lineItems.edges) {
            console.log(lineItem)
            dataArray.push(lineItem.node.product.id.slice(22))
        }

        if (res.data.data.order.lineItems.pageInfo.hasNextPage) {
            let finalIdx = res.data.data.order.lineItems.edges.length - 1
            let nextCursor = res.data.data.order.lineItems.edges[finalIdx].cursor
            console.log(`lineItems next page, cursor ${nextCursor}`)

            // [].push(lineItemPagination(order_id, cursor).data)
            dataArray.concat(await lineItemPagination(order_id, nextCursor, dataArray, accessToken, shop))
        }
        return dataArray
    } catch(err) {
        console.log(`failed in lineitems check ${err.stack}`)
    }

    // has next page ? then lineItemPagination

}

const ordersQuery = async (shop, accessToken, cursor='') => {
  console.log('\nTrying orders Query')
  try {
    let res = await axios({
        url: `https://${shop}/admin/api/graphql.json`,
        method: 'post',
        headers: { 'X-Shopify-Access-Token': accessToken },
        data: {
            query: `
                {
                    orders(first:10, ${cursor ? `after:"${cursor}",` : ''} query:"created_at:>#{2018-01-01T00:00:01}") {
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

    if (ordersPaginate) {ordersArray.concat(await ordersQuery(shop, accessToken, ordersCursor))}

    return ordersArray

  } catch(err) {
    console.log(`failed in orders check ${err.stack}`)
  }

}

module.exports = {

    customProductRank: (start, end) => {
        console.log("custom product rank", start, end)
        // query database directly
    },
    buildDatabase: async (shop, accessToken) => {
        // might need to add a cursor argument for pagination
        // need to have the "created at" for the next day's query be the time the last query started
        // save the current time on query
        console.log("buildDatabase", shop, accessToken)
        var datetime = new Date()
        console.log(datetime)
        let queryArr = []
        let counter = 0

        const productQueryBuilder = (products, orderID, month, week, createdAt) => {

          let tempArr = []
          products.forEach(product => { // for each line item

              console.log(`NESTED PRODUCT IDS ${product}\n`)

              // push all info in object to tempArr
              tempArr.push({
                orderId: orderID,
                productId: product,
                month: month,
                week: week,
                createdAt: createdAt
              })

              counter++

          })

          return tempArr
        }

        try {
            const ordersArray = await ordersQuery(shop, accessToken)
            console.log('\nCompleted orders array', ordersArray)

            /*
            order_id, product_id, month, week, order_created_at
            10000000, 1111111111,     1,    2,
            10000000, 2222222222,     1,    2, 2019-01-10T03:25:48Z
            19999999, 1010101010,     2,    7, 2019-02-21T03:28:48Z
            19999999, 2222222222,     2,    7, 2019-02-21T03:28:48Z

            need to insert on each iteration of line items because the database can look like
            the query object way can't handle multiple inserts

            */
            // if we are pushing values when we get them, the order of the column rows should change so the values array is correct
            // we can either change the column name order or store all the values and build the queryObj at the end like [option1, option4, option3, option2]
            // can have an object that persists through the loop with all the values we need to insert at the end in the right place
            // order created at or product created at?
            //console.log(res.data.data.orders.edges[0.node.lineItems.edges[0]])

            // let queryObj = {
            //     text: 'INSERT INTO orders_products (order_id, product_id, month, week, created_at) VALUES($1, $2, $3, $4, $5)',
            //     values: [],
            // }
            ordersArray.forEach(async order => { // for each order

                let tempArr = []
                console.log("\nORDER START")
                let orderID = order.node.id.slice(20)
                console.log("orderID", orderID) // add to queryObj
                let orderCreatedAt = order.node.createdAt
                console.log("orderCreatedAt", orderCreatedAt) // add to queryObj
                // date calculation
                let month = monthCalc(orderCreatedAt)
                let week = weekCalc(orderCreatedAt)

                console.log(`MONTH: ${month} WEEK: ${week}`)

                let lineItemsPaginate = order.node.lineItems.pageInfo.hasNextPage; // boolean
                let cursor = order.cursor
                let lineItemCursor = ''
                let resArray = order.node.lineItems.edges
                let lineItemsArray = []

                // deal with the first page of line items
                resArray.forEach((lineItem, index, array) => {
                  lineItemsArray.push(lineItem.node.product.id.slice(22))

                  if ( index === array.length - 1) {
                    lineItemCursor = lineItem.cursor
                    console.log(`pre paginated line items array ${lineItemsArray}`)
                  }
                });

                // paginate the remaining line items
                if (lineItemsPaginate) {
                    console.log(`NEXT PAGE ${lineItemsPaginate}`)
                    console.log(`lineItem next page cursor ${lineItemCursor}`)
                    lineItemsArray = lineItemsArray.concat(await lineItemPagination(orderID, lineItemCursor, [], accessToken, shop))
                    console.log("paginated line items ", lineItemsArray)

                    tempArr = productQueryBuilder(lineItemsArray, orderID, month, week, orderCreatedAt)
                    queryArr = queryArr.concat(tempArr)
                    console.log("Building Qeury Array...", queryArr)


                } else {

                  // if pushing to tempArr in if, else then multiple {} in one []
                  tempArr = productQueryBuilder(lineItemsArray, orderID, month, week, orderCreatedAt)
                  queryArr = queryArr.concat(tempArr)
                  console.log("Building Qeury Array...", queryArr)

                }


                console.log("ORDER FINISHED")
            });

            console.log("\nFULL QUERY ARRAY", counter, queryArr)

        } catch(err) {
            console.log(err.stack)
        }
    }
}
// .then(result => {
//             let { customers } = result.data.data;
//             paginate = customers.pageInfo.hasNextPage;
//             prevCursor = customers.edges[customers.edges.length - 1].cursor //last cursor (last node's cursor) in array
//             console.log(prevCursor);
//             customerArr = []
//             customerArr = [...customerArr, ...customers.edges];
//             if (!paginate) { //if hasNextPage is true, run a while loop to retrieve remaining customers
//                 console.log("many pages");
//                 sleep.sleep(4);
//                 requestCustomerPaginated(accessToken, shop, prevCursor, res, (x) => getOrders(x, accessToken, shop,0, (x) => mcSync(x, accessToken, shop, (x)  => res.send({ customerArray: x }))))
//             } else { //if hasNextPage is false, no need to paginate
//                 getOrders(customerArr, accessToken, shop, 0, (customerArr) => mcSync(customerArr, accessToken, shop, (customerArr) => res.send({ customerArray: customerArr })))
//             }
//             }).catch(error => {
//             console.log(error)
//             })
//     }
