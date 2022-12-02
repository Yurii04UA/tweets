const { ETwitterStreamEvent } = require('twitter-api-v2')

const TwitterApi = require('twitter-api-v2').default

module.exports = async (app, socketConnection) => {
    const client = new TwitterApi('AAAAAAAAAAAAAAAAAAAAAIOffAEAAAAAwgZmrDXsZocUQUGZqD%2F7%2BLfQGdI%3DxG8c9zec4y9Oi0Zid5qxLG417HRVRZj3vgtNhwwmbActLFQX11')


    const rules = await client.v2.streamRules()

    await client.v2.updateStreamRules({
        delete: {
          ids: rules?.data?.map(rule => rule.id) || '',
        },
      })

    const r = await client.v2.updateStreamRules({
        add: [
          {value: '#ethereum'}
        ],
      })
      console.log(r)
    const streamFilter = await client.v2.searchStream({
    expansions:
        'author_id,attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id',
    'tweet.fields':
      'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,referenced_tweets,text',
    'user.fields': 'id,name,profile_image_url,protected,url,username,verified',
    'media.fields':
      'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics'
    })
    streamFilter.autoReconnect = true
    streamFilter.on('data event content', (data) => sendMessage(data))
    streamFilter.on(ETwitterStreamEvent.ConnectionClosed, () => console.log('stream closed'))
    streamFilter.on(ETwitterStreamEvent.ReconnectAttempt, (att) => console.log('reconnecting:', att))



    const sendMessage = (msg) => {
        socketConnection.emit('tweets', msg)
    }
}