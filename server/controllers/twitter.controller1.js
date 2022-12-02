const Tweet = require('../models/Tweet')
const TwitterApi = require('twitter-api-v2').default
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET
const client = new TwitterApi({ appKey: API_KEY, appSecret: API_SECRET });

exports.recentApi = async (req, res, next) => {
    const startTime = new Date() - ((60000 * 60) *48)
    
    let initial = {
      data: [],
      includes: {
        media: [],
        users: []
      },
      meta: {}
    }
    
    const loggedApp = new TwitterApi({
      appKey: API_KEY,
      appSecret: API_SECRET,
      accessToken: req.session.accessToken,
      accessSecret: req.session.accessSecret
    });
    
    try {
      const user = await loggedApp.currentUser()
      let recent
      let tweetsList
      const filtersLength = req.query.filters.split(' OR ').length
      if (filtersLength < 2) {
        recent = await loggedApp.v2.search(req.query.filters, {
          max_results: req.query.amount,
          start_time: new Date(startTime).toISOString(),
          sort_order: 'relevancy',
          expansions:
            'author_id,attachments.media_keys',
            'tweet.fields': 'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
            'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
            'media.fields': 'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
        })
        console.log('recent ', recent)
        tweetsList = { data: recent?.data?.data, includes: recent?.data?.includes, meta: recent?.data?.meta }
        console.log('tweetsList ', tweetsList)
        const newData = await Tweet.findOneAndUpdate(
          {name: user.screen_name, id_str: user.id_str}, 
          {tweetsList}, 
          {upsert: true, new: true, setDefaultsOnInsert: true}
        )
        console.log('newData ', newData)
        res.send(newData?.tweetsList)
      } else {
        const tags = req.query.filters.split(' ').filter(q => (q.includes('#') || q.includes('from:')))
        console.log('tags ', tags)
  
        async function *recentItems() {
            // const authors = req.query.filters.split(' ').filter(tag => tag.includes('from:')).map(tag => tag.replace('(', '').replace(')', ''))
            // const from = authors.length > 1 ? `(${authors.join(' OR ')})` : authors
            for (let i = 0; i < tags.length; i++) {
              const recentItem = await  loggedApp.v2.search(`${tags[i]}`, {
                max_results: Math.round(req.query.amount / tags.length) < 10 ? 10 : Math.round(req.query.amount / tags.length),
                start_time: new Date(startTime).toISOString(),
                sort_order: 'relevancy',
                expansions:
                  'author_id,attachments.media_keys',
                  'tweet.fields': 'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,text',
                  'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
                  'media.fields': 'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
              })
              yield console.log('recentItem ', recentItem.data)
              yield recentItem;
            }
          }

        (async () => {
    
          let generator = recentItems();
          console.log('second async generator ', generator)
          const dataArrs = []
    
          const expandedFill = (arr) => {
            const finalLength = Math.round(req.query.amount / tags.length)
            if (arr.length === finalLength) {
              return arr
            } else {
              const concatCount = Math.round(finalLength / arr.length)
              const filledArr = [].concat(arr)
              for (let i = 0; i < concatCount; i++) {
                filledArr.concat(arr)
                console.log('concarr', filledArr)
              }
              return filledArr.slice(0, (finalLength - 1))
            }
          }
    
          for await (let value of generator) {
            if (value?.data?.data !== undefined) {
                console.log('value of generator data ', value?.data)
                console.log('value of generator data data ', value?.data?.data)
                dataArrs.push(value?.data?.data)
                // const initialArr = value?.data?.data
                // dataArrs.push(expandedFill(initialArr))
            }
            // initial.data = (value?.data?.data === undefined ? initial.data : initial.data.concat(value?.data?.data))
            initial.includes.media = (value?.data?.includes === undefined ? initial.includes.media : initial.includes.media.concat(value?.data?.includes?.media))
            initial.includes.users = (value?.data?.includes === undefined ? initial.includes.users : initial.includes.users.concat(value?.data?.includes?.users))
            initial.meta = value?.data?.meta
              
          }
          console.log('dataArrs ', dataArrs)
          const arrsCount = dataArrs.length
          const newDataArr = new Array(dataArrs.flat().length)
          console.log('newDataArr ', newDataArr)
          console.log('Math.round(req.query.amount / tags.length) ', Math.round(req.query.amount / tags.length))
          for (let i = 0; i < Math.round(req.query.amount / tags.length); i++) {
            for (let j = 0; j < dataArrs.length; j++) {
              if (dataArrs[j][i] !== undefined)
                newDataArr[arrsCount*i+j] = dataArrs[j][i]
            }
          }
          initial.data = newDataArr
          console.log('initial.data ', initial.data)
          tweetsList = initial
          const newData = await Tweet.findOneAndUpdate(
            {name: user.screen_name, id_str: user.id_str}, 
            {tweetsList}, 
            {upsert: true, new: true, setDefaultsOnInsert: true}
          )
          console.log('newData ', newData)
          res.send(newData?.tweetsList)
        })()
      } 
      
    } catch (err) {
      console.log('recentApi route error ', err)
      res.status(500).send(`recentApi route error ${err}`);
      next(err)
    }
}

exports.tokenRequest = async (req, res, next) => {
    try{
      const authLink = await client.generateAuthLink('https://embed-tweets.herokuapp.com/', { linkMode: 'authorize' });
      const sess = req.session
      sess.oauth_token_secret = authLink.oauth_token_secret
      res.send(authLink)
  
    } catch (err) {
      console.log('tokenRequest route error ', err)
      res.status(500).send(`tokenRequest route error ${err}`);
      next(err)
    }
}

exports.callback = (req, res, next) => {
    // Extract tokens from query string
    const { oauth_token, oauth_verifier } = req.query;
    // Get the saved oauth_token_secret from session
    const { oauth_token_secret } = req.session;
  
    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
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
          res.send({user: response, accessToken, accessSecret})
        })
        // loggedClient is an authenticated client in behalf of some user
        // Store accessToken & accessSecret somewhere
      })
      .catch(() => {
        res.status(500).status(403).send('Invalid verifier or access tokens!')
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
      .then(result => res.send(result.tweetsList || {}))
    } catch (err) {
        console.log('recent route error ', err)
        res.status(500).send(`recent route error ${err}`);
        next(err)
    }
  }

exports.logout = async (req, res, next) => {
    try {
      // loggedApp = undefined
      res.send('cleared')
    } catch (err) {
        res.status(500).send(`logout route error ${err}`);
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
      res.send('logged')
    } catch (err) {
        console.log('me route error ', err)
        res.status(500).send(`me route error ${err}`);
        next(err)
    }
}