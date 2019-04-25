// import axios to make graphql call
const axios = require('axios');
// import 
const {
    SHOPIFY_SECRET
  } = process.env;
module.exports = {

    customProductRank: (start, end) => {
        console.log("custom product rank", start, end)
        // query database directly 
    },
    buildDatabase: async (shop, accessToken) => {
        console.log("buildDatabase", shop, accessToken)
        // try {
        //     const res = await axios({
        //         url: `https://${shop}/admin/api/graphql.json`,
        //         method: 'post',
        //         headers: { 'X-Shopify-Access-Token': accessToken },
        //         data: {
        //             query: `
        //                 {
        //                     orders(first:20, query:"created_at:>#{2019-01-01T00:00:01}") {
        //                         edges {
        //                         cursor
        //                             node {
        //                                 createdAt
        //                                 id
        //                                 lineItems(first:10) {
        //                                     edges {
        //                                         node {
        //                                             variant {
        //                                                 id
        //                                                 displayName
        //                                             }
        //                                             product {
        //                                                 id
        //                                                 createdAt
        //                                                 title
        //                                                 featuredImage {
        //                                                     originalSrc
        //                                                 }
        //                                             }
        //                                         }
        //                                     }
        //                                     pageInfo {
        //                                         hasNextPage
        //                                     }
        //                                 }
        //                             }
        //                         }
        //                         pageInfo {
        //                             hasNextPage
        //                         }
        //                     }
        //                 }
        //             `
        //         }
        //     })
        //     console.log(res) // do stuff
        // } catch(err) {
        //     console.log(err.stack)
        // }
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