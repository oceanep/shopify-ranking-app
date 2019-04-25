// import axios to make graphql call
const axios = require('axios');
const db = require('../db')
// import 

module.exports = {

    customProductRank: (start, end) => {
        console.log("custom product rank", start, end)
        // query database directly 
    },
    buildDatabase: async (shop, accessToken) => {
        // might need to add a cursor argument for pagination
        console.log("buildDatabase", shop, accessToken)
        try {
            const res = await axios({
                url: `https://${shop}/admin/api/graphql.json`,
                method: 'post',
                headers: { 'X-Shopify-Access-Token': accessToken },
                data: {
                    query: `
                        {
                            orders(first:20, query:"created_at:>#{2019-01-01T00:00:01}") {
                                edges {
                                cursor
                                    node {
                                        createdAt
                                        id
                                        lineItems(first:10) {
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
            */
            // need for each loops where [0] is 
            // can get all information at same level as "id"

            const ordersArray = res.data.data.orders.edges
            const ordersNextPage = res.data.data.orders.pageInfo.hasNextPage
            let queryObj = {
                text: 'INSERT INTO orders_products (order_id, product_id, month, week, created_at) VALUES($1, $2, $3, $4)',
                values: [],
            }
            ordersArray.forEach(order => { // for each order

                let orderID = order.node.id.slice(20)
                queryObj.values.push(orderID)

                // if ordersNextPage then paginate 

                // if we are pushing values when we get them, the order of the column rows should change so the values array is correct
                // we can either change the column name order or store all the values and build the queryObj at the end like [option1, option4, option3, option2]

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