const Tweet = require('../models/Tweet')
const TwitterApi = require('twitter-api-v2').default
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET
const client = new TwitterApi({ appKey: API_KEY, appSecret: API_SECRET });

function *recentItem(loggedApp, tag, max_results, startTime) {  
    const recentItem = yield loggedApp.v2.search(`${tag}`, {
      max_results: max_results,
      start_time: new Date(startTime).toISOString(),
      sort_order: 'relevancy',
      expansions:
        'author_id,attachments.media_keys',
        'tweet.fields': 'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
        'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
        'media.fields': 'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
    })
    yield console.log('recentItem ', recentItem)
    yield recentItem;
}


exports.recentApi = async (req, res, next) => {
    const startTime = new Date() - ((60000 * 60) *48)
    
    const loggedApp = new TwitterApi({
      appKey: API_KEY,
      appSecret: API_SECRET,
      accessToken: req.session.accessToken,
      accessSecret: req.session.accessSecret
    });
    
    try {
      const user = await loggedApp.currentUser()
      
      let tweetsList
      const filtersLength = req.query.filters.split(' OR ').length
      if (filtersLength < 2) {
        let twitterApiResults = []
        let initial = {
          data: [],
          includes: {
            media: [],
            users: []
          },
          meta: {}
        }
        twitterApiResults = await loggedApp.v2.search(req.query.filters, {
          max_results: req.query.amount,
          start_time: new Date(startTime).toISOString(),
          sort_order: 'relevancy',
          expansions:
            'author_id,attachments.media_keys',
            'tweet.fields': 'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
            'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
            'media.fields': 'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
        })
        
        if (twitterApiResults.data.data.length < req.query.amount) {
          const amountRepeats = Math.ceil(req.query.amount / twitterApiResults.data.data.length)
          for(let i = 0; i < amountRepeats; i++) {
            for (let j = 0; j < twitterApiResults?.data?.data.length; j++) {
              if (initial.data.length < req.query.amount) {
                initial.data.push(twitterApiResults.data.data[j])
              }
              initial.includes.media = (twitterApiResults.data?.includes === undefined ? initial.includes.media : initial.includes.media.concat(twitterApiResults.data?.includes?.media))
              initial.includes.users = (twitterApiResults.data?.includes === undefined ? initial.includes.users : initial.includes.users.concat(twitterApiResults.data?.includes?.users))
              initial.meta = twitterApiResults.data?.meta
            }
          }

          tweetsList = initial
          const newData = await Tweet.findOneAndUpdate(
            {name: user.screen_name, id_str: user.id_str}, 
            {tweetsList}, 
            {upsert: true, new: true, setDefaultsOnInsert: true}
          )

          res.status(200).send(newData?.tweetsList)
        } else {
          tweetsList = { data: twitterApiResults?.data?.data, includes: twitterApiResults?.data?.includes, meta: twitterApiResults?.data?.meta }

          const newData = await Tweet.findOneAndUpdate(
            {name: user.screen_name, id_str: user.id_str}, 
            {tweetsList}, 
            {upsert: true, new: true, setDefaultsOnInsert: true}
          )
          res.status(200).send(newData?.tweetsList)
        }
      } else {
        let initial = {
          data: [],
          includes: {
            media: [],
            users: []
          },
          meta: {}
        }
        const tags = req.query.filters.split(' ').filter(q => (q.includes('#') || q.includes('from:')))
        const max_results = Math.ceil(req.query.amount / tags.length) + 20
        let apiResults = [], combinedApiResults = [], mixApiResults = [];
  
        // get tweets from the twitter api

        for (let i = 0; i < tags.length; i++) {
          let recentItem = await loggedApp.v2.search(`${tags[i]}`, {
            max_results: max_results,
            start_time: new Date(startTime).toISOString(),
            sort_order: 'relevancy',
            expansions:
              'author_id,attachments.media_keys',
              'tweet.fields': 'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
              'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
              'media.fields': 'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
          })
          await apiResults.push(recentItem)
        }

        // combining Api Results

        for(let i = 0; i < apiResults.length; i++) {
          combinedApiResults.push(apiResults[i]?.data?.data)
          initial.includes.media = (apiResults[i]?.data?.includes === undefined ? initial.includes.media : initial.includes.media.concat(apiResults[i]?.data?.includes?.media))
          initial.includes.users = (apiResults[i]?.data?.includes === undefined ? initial.includes.users : initial.includes.users.concat(apiResults[i]?.data?.includes?.users))
          initial.meta = apiResults[i]?.data?.meta
        }

        console.log('apiResults.length ', apiResults.length)

        // mix Api Results according to search

        for(let i = 0; i < req.query.amount; i++) {
          for (let j = 0; j < combinedApiResults.length; j++) {
            if (combinedApiResults[j][i]) {
              if (initial.data.length < req.query.amount) {
                initial.data.push(combinedApiResults[j][i])
              }
            }
          }
        }

        console.log('max_results ', max_results)
        console.log('initial ', initial)
        tweetsList = initial
        const newData = await Tweet.findOneAndUpdate(
            {name: user.screen_name, id_str: user.id_str}, 
            {tweetsList}, 
            {upsert: true, new: true, setDefaultsOnInsert: true}
        )
        console.log('newData ', newData)
        res.status(200).send(newData?.tweetsList)
      } 
      
    } catch (err) {
      console.log('recentApi route error ', err)
      res.status(400).send(`recentApi route error ${err}`);
      next(err)
    }
}

exports.tokenRequest = async (req, res, next) => {
    try{
      console.log('process.env.GENERATE_AUTH_LINK ', process.env.GENERATE_AUTH_LINK)
      const authLink = await client.generateAuthLink(process.env.GENERATE_AUTH_LINK, { linkMode: 'authorize' });
      console.log('authLink ', authLink)
      const sess = req.session
      sess.oauth_token_secret = authLink.oauth_token_secret
      console.log('req.session ', req.session)
      console.log('authLink.oauth_token_secret ', authLink.oauth_token_secret)
      res.status(200).send(authLink)
  
    } catch (err) {
      console.log('tokenRequest route error ', err.message)
      res.status(500).send(`tokenRequest route error ${err}`);
      next(err)
    }
}

exports.callback = (req, res, next) => {
    // Extract tokens from query string
    const { oauth_token, oauth_verifier } = req.query;
    // Get the saved oauth_token_secret from session
    const { oauth_token_secret } = req.session;
    console.log('oauth_token_secret1 ', req.session)
    console.log('oauth_token ', oauth_token)
    console.log('oauth_verifier ', oauth_verifier)
  
    // if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    if (!oauth_token || !oauth_verifier) {
      return res.status(400).send('You denied the app or your session expired!');
    }
  
    const client = new TwitterApi({
      appKey: API_KEY,
      appSecret: API_SECRET,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });
  
    client.login(oauth_verifier)
      .then(({ client: loggedClient, accessToken, accessSecret }) => {
        req.session.accessToken = accessToken
        req.session.accessSecret = accessSecret
  
        loggedClient.currentUser()
        .then((response) => {
          Tweet.findOneAndUpdate({name: response.screen_name, id_str: response.id_str}, 
            {expire: new Date()}, 
            {upsert: true, new: true, setDefaultsOnInsert: true},
            (err, res) => {if (err) return})
          res.status(200).send({user: response, accessToken, accessSecret})
        })
        // loggedClient is an authenticated client in behalf of some user
        // Store accessToken & accessSecret somewhere
      })
      .catch(() => {
        res.status(403).send('Invalid verifier or access tokens!')
      });  
}

exports.recent = async (req, res, next) => {
    try {
      let user
      if (req.query.user) {
        user = req.query.user
      } else {
        const loggedApp = new TwitterApi({
        appKey: API_KEY,
        appSecret: API_SECRET,
        accessToken: req.session.accessToken,
        accessSecret: req.session.accessSecret
      });
      const _currentUser = await loggedApp.currentUser()
      user = _currentUser.id_str
      }
  
      Tweet.findOne({id_str: user}) 
      .then(result => res.status(200).send(result.tweetsList || {}))
    } catch (err) {
        console.log('recent route error ', err)
        res.status(500).send(`recent route error ${err}`);
        next(err)
    }
  }

exports.logout = async (req, res, next) => {
    try {
      // loggedApp = undefined
      res.status(200).send('cleared')
    } catch (err) {
        res.status(404).send(`logout route error ${err}`);
        next(err)
    }
}

exports.me = async (req, res, next) => {
    try {
      const client = new TwitterApi({
        appKey: API_KEY,
        appSecret: API_SECRET,
        accessToken: req.body.accessToken,
        accessSecret: req.body.accessSecret
      });
      // loggedApp = client
      console.log('test')
      res.status(200).send('logged')
    } catch (err) {
        console.log('me route error ', err)
        res.status(404).send(`me route error ${err}`);
        next(err)
    }
}