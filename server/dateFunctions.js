const userAuth = require('./getUser')
const moment = require('moment');

module.exports = {
    dayCalc: async (target) => { // now utc.moment obj, origin from db
        // let target = moment.utc() // current time in moment obj
        let auth = await userAuth.getUser() // get auth values from db

        let origin = moment.utc(auth.origin) // convert to moment obj
        // target (current time) - origin (database origin)
        return origin.diff(target, 'days') + 1 // days: 64
    },
    timeIntervalMoment: (timeInterval, now) => { // returns moment obj
        return now.subtract(+timeInterval, "days")
    }
}
