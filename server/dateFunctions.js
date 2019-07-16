const userAuth = require('./getUser')
const moment = require('moment');

module.exports = {
    dayCalc: async (target, shop) => { // now utc.moment obj, origin from db
        // let target = moment.utc() // current time in moment obj
        let auth = await userAuth.getUser(shop) // get auth values from db
        console.log('date functions shop', auth.shop)

        console.log('Day Calc auth.origin', auth.origin)
        let origin = moment.utc(auth.origin) // convert to moment obj
        console.log('Day Calc origin, target', origin, target)
        // target (current time) - origin (database origin)
        return target.diff(origin, 'days') + 1 // days: 64
    },
    timeIntervalMoment: (timeInterval, now) => { // returns moment obj
        let result = now.clone()
        return result.subtract(+timeInterval, "days")
    }
}
