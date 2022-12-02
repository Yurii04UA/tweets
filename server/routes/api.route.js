const { query } = require('express')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const router = require('express').Router()

const twitterController = require('../controllers/twitter.controller')

// let loggedApp
// const client = new TwitterApi('AAAAAAAAAAAAAAAAAAAAAIOffAEAAAAAwgZmrDXsZocUQUGZqD%2F7%2BLfQGdI%3DxG8c9zec4y9Oi0Zid5qxLG417HRVRZj3vgtNhwwmbActLFQX11')
var store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'mySessions'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

console.log('routes');
router.use(session({secret: process.env.SESSION_SECRET, saveUninitialized: true, store: store, resave: false, cookie: { maxAge: (60000 * 60 * 24 * 10) }}));

router.get('/recent-api', twitterController.recentApi)

router.get('/token-request', twitterController.tokenRequest)

router.get('/callback', twitterController.callback);

router.get('/recent', twitterController.recent)

router.get('/logout', twitterController.logout)

router.post('/me', twitterController.me)
module.exports = router