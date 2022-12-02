import axios from 'axios';
import React, { useEffect, useState } from 'react';
import NonceGenerator from 'a-nonce-generator';
import crypto from 'crypto';

const Auth = (props) => {
    const timestamp = Date.now()
    const ng = new NonceGenerator()
    const nonce = ng.generate();
    const method = 'POST'
    const url = 'https://api.twitter.com/oauth/request_token'
    const API_KEY = "dvOwXwgmts10o7U4tm4Npp3jc"
    const API_SECRET = "UPLjyxj3kzUUduIboQCgQXLuYmHq74DTYMarnXcxm6RnRql7va"
    const ACCESS_TOKEN = "1550536741630738433-qJNUkIDnp9YWmjBLduLtjxBdHjEWAN"
    // const ACCESS_TOKEN_SECRET = '3vHl0SU2SOXxyttJqYfJBGdKXBqMfT9vHljpBPEOFnLwg'
    const signingKey = `&${encodeURIComponent(API_SECRET)}`
    const stringForSignature = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(`oauth_callback=https://embed-tweets.herokuapp.com/&oauth_consumer_key=${API_KEY}&oauth_nonce=${nonce}&oauth_signature_method=HMAC-SHA1&oauth_timestamp=${timestamp}&oauth_token=${ACCESS_TOKEN}&oauth_version=1.0`)}`
    const signature = crypto.createHmac("sha1", signingKey).update(stringForSignature).digest().toString('base64');

    const authClickHandler = async() => {
        await axios
            .get(`/api/token-request`)
            .then((res) => window.location.href = res.data.url)
    }
    
    return (
        <div className='authIntro'>
            <h1>To continue, please authorize yourself</h1>
            <button className='authBtn' onClick={authClickHandler}>
                authorize with Twitter
            </button>
        </div>
    )
}

export default Auth

