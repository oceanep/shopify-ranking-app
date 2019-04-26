// import axios to make graphql call
const axios = require('axios');
const db = require('../db')
// import 

const lineItemPagination = async (order_id, cursor, dataArray) => {
    // gql query 
    try {
        const res = await axios({
            url: `https://${shop}/admin/api/graphql.json`,
            method: 'post',
            headers: { 'X-Shopify-Access-Token': accessToken },
            data: {
                query: `
                    {
                        order(id: "gid://shopify/Order/${order_id}") {
                            createdAt
                            id
                            lineItems(first:10,${cursor ? `after:${cursor}` : ''}) {
                                edges {
                                    cursor
                                    node {
                                        variant {
                                            id
                                            displayName
                                        }
                                        product {
                                            id
                                            createdAt
                                            title
                                            featuredImage {
                                                originalSrc
                                            }
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
        for (const lineItem of res.data.data.orders.lineItems.edges) {
            console.log(lineItem.node.product.id.slice(22))
            // dataArray.push(lineItem.node.product.id.slice(22))
        }
        
        if (res.data.data.orders.lineItems.pageInfo.hasNextPage) {
            let cursor = res.data.data.orders.lineItems.edges.cursor
            // [].push(lineItemPagination(order_id, cursor).data)
            dataArray.concat(lineItemPagination(order_id, cursor))
        }
        return dataArray
    } catch(err) {
        console.log(err.stack)
    }

    // has next page ? then lineItemPagination 

}

module.exports = {

    customProductRank: (start, end) => {
        console.log("custom product rank", start, end)
        // query database directly 
    },
    buildDatabase: async (shop, accessToken, cursor='') => {
        // might need to add a cursor argument for pagination
        // need to have the "created at" for the next day's query be the time the last query started
        // save the current time on query
        console.log("buildDatabase", shop, accessToken)
        var datetime = new Date();
        console.log(datetime);
        let queryObj = {
            order_id: '',
            product_id: '',
            month: null, 
            week: null,
            created_at: ''
        }
        try {
            const res = await axios({
                url: `https://${shop}/admin/api/graphql.json`,
                method: 'post',
                headers: { 'X-Shopify-Access-Token': accessToken },
                data: {
                    query: `
                        {
                            orders(first:20,${cursor ? `after:${cursor},` : ''}query:"created_at:>#{2019-01-01T00:00:01}") {
                                edges {
                                cursor
                                    node {
                                        createdAt
                                        id
                                        lineItems(first:1) {
                                            edges {
                                                node {
                                                    variant {
                                                        id
                                                        displayName
                                                    }
                                                    product {
                                                        id
                                                        createdAt
                                                        title
                                                        featuredImage {
                                                            originalSrc
                                                        }
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
            // await buildDatabase(res.data)
            // console.log(res.data.data.orders.edges) // array of elements that contain node property
            /*
            console.log(res.data.data.orders.pageInfo) // { hasNextPage: true }
            console.log(res.data.data.orders.edges[0].node.id) // gid://shopify/Order/1249435222083
            console.log(res.data.data.orders.edges[0].node.createdAt) // 2019-04-18T03:25:48Z

            console.log(res.data.data.orders.edges[0].node.lineItems.pageInfo) // { hasNextPage: false }
            console.log(res.data.data.orders.edges[0].node.lineItems.edges[0].node.product.id) // 'gid://shopify/Product/2112769884227'

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
            console.log(res.data.data)
            const ordersArray = res.data.data.orders.edges
            const ordersPaginate = res.data.data.orders.pageInfo.hasNextPage // boolean
            let queryObj = {
                text: 'INSERT INTO orders_products (order_id, product_id, month, week, created_at) VALUES($1, $2, $3, $4, $5)',
                values: [],
            }
            ordersArray.forEach(async order => { // for each order

                let orderID = order.node.id.slice(20)
                console.log("orderID", orderID) // add to queryObj
                let orderCreatedAt = order.node.createdAt
                console.log("orderCreatedAt", orderCreatedAt) // add to queryObj
                // date calculation

                let lineItemsPaginate = order.node.lineItems.pageInfo.hasNextPage; // boolean
                let cursor = order.node.edges[0].cursor
                let resArray = res.data.data.orders.lineItems.edges
                let lineItemArray = []

                // deal with the first page of line items
                resArray.forEach(lineItem => {
                    lineItemArray.push(lineItem.node.product.id.slice(22))
                });
                // paginate the remaining line items
                if (lineItemsPaginate) {
                    console.log("NEXT PAGE")
                    lineItemsArray.concat( await lineItemPagination(orderID, cursor, []) )
                    // let paginatedArray = await lineItemPagination(orderID, cursor, [])
                }

                // line item pagination function
                // lineItemPagination(x, x, [])

                

                lineItemsArray.forEach(lineItem => { // for each line item
                    let productID = lineItem.node.product.id.slice(22)

                    console.log("productID", productID)
                    // queryObj
                    // orderid 4334234
                    // orderid 4232343
                    // build array of objects

                    // if lineItemsPaginate paginate line items
                });

                // if ordersPaginate then paginate 
                // 

            });
            // await db.query(myObj) function
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