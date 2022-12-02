import React from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react';
import * as Scroll from 'react-scroll';
import { Link, Button, Element, Events, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'
import Tweet from './components/Tweet';

import './App.css'

import search from './assets/searchWhite.svg'
import TagLabel from './components/TagLabel';
import ButtonLoader from './components/ButtonLoader';
import Auth from './components/Auth'

import Loader from './assets/circlesLoader.gif'
import UserInfo from './components/UserInfo';

function App() {

  const optionsAmount = [
    { value: 10, text: '10' },
    { value: 20, text: '20' },
    { value: 30, text: '30' },
    { value: 40, text: '40' },
    { value: 50, text: '50' },
    { value: 60, text: '60' },
    { value: 70, text: '70' },
    { value: 80, text: '80' },
    { value: 90, text: '90' },
    { value: 100, text: '100' },
  ];
  // const optionsAmount = [
  //   { value: 20, text: '20' },
  //   { value: 30, text: '30' },
  //   { value: 50, text: '50' },
  //   { value: 70, text: '70' },
  //   { value: 100, text: '100' },
  // ];
  const optionsInterval = [
    { value: 1, text: '1' },
    { value: 3, text: '3' },
    { value: 10, text: '10' },
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const [cookies, setCookie, removeCookie] = useCookies();
  const [formValues, setFormValues] = useState({
    amount: optionsAmount[9].value,
    // amount: optionsAmount[4].value,
    interval: optionsInterval[0].value
  })
  const initialQuery = searchParams.get('filters')
  const oauth_token = searchParams.get('oauth_token')
  const oauth_verifier = searchParams.get('oauth_verifier')
  const user = searchParams.get('user')
  const [tweets, setTweets] = useState({})
  const [comparedTweets, setComparedTweets] = useState({})
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLogged, setIsLogged] = useState(!!cookies.tokens)
  const [firstRender, setFirstRender] = useState(true)

  const checkInput = () => {
    let dog = searchString.split('').filter(e => e === '@');
    let hash = searchString.split('').filter(e => e === '#');
    if (dog.length > 1) {
      let newStr = searchString.replaceAll('@', '');
      setSearchString('@' + newStr);
    }
    if (hash.length > 1) {
      let newStr = searchString.replaceAll('#', '');
      setSearchString('#' + newStr);
    }

  };

  const handleAmountChange = ({ target: { value } }) => {
    setFormValues({ ...formValues, amount: value })
    setComparedTweets(tweets)
  }
  const handleIntervalChange = ({ target: { value } }) => {
    setFormValues({ ...formValues, interval: value })
  }

  useEffect(() => {
    if (!(tweets?.data?.length === comparedTweets?.data?.length && tweets?.data?.map(tweet => tweet?.text).every((value, index) => value === comparedTweets?.data?.map(tweet => tweet?.text)[index]))) {
      console.log('setcomp') 
      setComparedTweets(tweets)
    }
  }, [tweets])

  useEffect(() => {
    query.length === 0 && setTweets({})
  }, [query])

  useEffect(() => {
    if (cookies.tokens) {
      axios
        .post('/api/me', {
          accessToken: cookies.tokens.accessToken,
          accessSecret: cookies.tokens.accessSecret
        })
        .then((res) => {
          setIsLogged(true)
        })
        .catch(() => setIsLogged(false))
    }
  }, [])

  useEffect(() => {
    if (initialQuery === ' ' || initialQuery === '#') setSearchParams({})
  }, [initialQuery])

  useEffect(() => {
    if (oauth_token !== null) {
      axios
        .get('/api/callback', {
          params: {
            oauth_token: oauth_token,
            oauth_verifier: oauth_verifier
          }
        })
        .then((res) => {
          setCookie('user', { name: res.data.user.name, photo: res.data.user.profile_image_url_https, id_str: res.data.user.id_str })
          setCookie('tokens', { accessToken: res.data.accessToken, accessSecret: res.data.accessSecret })
          setIsLogged(true)
        })
        .catch(() => setIsLogged(false))
    }
  }, [oauth_token])

  const handleChange = (e) => {
    setSearchString(e.target.value)
  }

  // need to move validation outside fn and optimize it
  const submitSearch = (e) => {
    e.preventDefault()
    let dog = searchString.split('').filter(e => e === '@');
    let hash = searchString.split('').filter(e => e === '#');
    if(dog.length > 1 || hash.length > 1) {
      setSearchString('')
      return
    } else if (dog.length === 1 && searchString.length === 1) {
      setSearchString('')
      return
    }else {
      setQuery((prev => prev.concat(searchString).filter(item => item !== ' ' && item !== '#')))
      setSearchString('')
    }
    
  }

  useEffect(() => {
    if (query.length > 0) {
    setIsLoading(true)
    const changedQueries = query.map(q => {
      return `${(!q.includes('#') && !q.includes('@')) ? '#' : ''}${q.replace('@', 'from:')}`
    })
    const filtersNew = changedQueries.join(' OR ')

    // const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
          const amount = formValues.amount
          axios
            .get('/api/recent-api', {
              params: { filters: filtersNew, amount }
            })
            .then((res) => {
              setIsLoading(false) 
              setSearchParams({ ...searchParams, filters: filtersNew, user: cookies?.user?.id_str, amount })
                setTweets(res.data)
            })
            .catch((e) => {
              setIsLoading(false)
            })
          }
  // }, [query.length]) 
  }, [query.length, formValues.amount]) // rerender if we change amount

  useEffect(() => {
    if (isLogged) {
      searchParams.delete('oauth_token')
      searchParams.delete('oauth_verifier')
      setSearchParams(searchParams)
      setIsLoading(true)
      axios
        .get('/api/recent', {
        })
        .then((res) => {
          setIsLoading(false)
          setTweets(res.data)
        })
        .catch((e) => {
          setIsLoading(false)
        })
    }
  }, [isLogged])

  useEffect(() => {
    if (!isLogged && user !== null) {
      const intID = setInterval(function recentCallback() {
        axios
          .get(`/api/recent?user=${user}`, {
          })
          .then((res) => {
            setIsLoading(false)
              setTweets(res.data)
          })
          .catch((e) => {
            setIsLoading(false)
          })
      }(), formValues.interval * 60000)
      return () => clearInterval(intID)
    }
  }, [isLogged, user])

  useEffect(() => {
    if (isLogged && comparedTweets?.data?.length > 0 && query.length === 0) {
      const intervalId = window.setInterval(() => { }, 0);

      for (let i = 1; i <= intervalId; i++) {
        window.clearInterval(i);
      }
      const intID = setInterval(() => {
        axios
          .get('/api/recent', {
          })
          .then((res) => {
            setIsLoading(false)
              setTweets(res.data)
          })
          .catch((e) => {
            setIsLoading(false)
          })
      }, formValues.interval * 60000)
      return () => clearInterval(intID)
    }

  }, [isLogged, query.length, comparedTweets])

  useEffect(() => {
    if (comparedTweets?.data?.length > 0) {
      let ind = 0
      const intv = setInterval(() => {
        ind++
        scroller.scrollTo(ind.toString(), {
          duration: 3500,
          offset: -150,
          delay: 0,
          smooth: true,
        })
      }, 5500)
      // window.addEventListener('scroll', clearInterval(intv))
      if (ind === comparedTweets.length - 1) {
        clearInterval(intv)
      }
      return () => {
        clearInterval(intv)
        // window.removeEventListener('scroll', clearInterval(intv))
      }
    }
  }, [comparedTweets])
  const recentApiIntervalCallback = () => {
    // const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
    const changedQueries = query.map(q => {
      return `${(!q.includes('#') && !q.includes('@')) ? '#' : ''}${q.replace('@', 'from:')}`
    })
    const filtersNew = changedQueries.join(' OR ')
    const amount = formValues.amount
    axios
      .get('/api/recent-api', {
        params: { filters: filtersNew, amount }
      })
      .then((res) => {
        setIsLoading(false) 
        setSearchParams({ ...searchParams, filters: filtersNew, user: cookies?.user?.id_str, amount })
          setTweets(res.data)
      })
      .catch((e) => {
        setIsLoading(false)
      })
    // return apiIntCallback;
  }
  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
    } else {
      if (query.length !== 0) {
        const intervalId = window.setInterval(() => { }, 0);

        for (let i = 1; i <= intervalId; i++) {
          window.clearInterval(i);
        }
        const apiInt = setInterval(recentApiIntervalCallback, formValues.interval * 60000)
        return () => clearInterval(apiInt)
      } 
      // else if (query.length === 0 && initialQuery !== null && isLogged) {
      //   setQuery(initialQuery.split(' ').filter(query => query !== ' ' && query !== '#' && query !== 'OR').map(item => item.replace('(', '').replace(')', '')))
      // }
    }
  }, [query, formValues?.amount, firstRender, formValues?.interval])

  const clearIntervals = () => {
    const intervalId = window.setInterval(() => { }, 0);

    for (let i = 1; i <= intervalId; i++) {
      window.clearInterval(i);
    }
  }
  const authClickHandler = async () => {
    await axios
      .get(`/api/token-request`)
      .then((res) => window.location.href = res.data.url)
  }

  //disabled input if no logged and query more 10
  const isDisabledInput = () => {
    if(!isLogged || query.length > 9) {
      return true;
    }
    return false;
  }

  const resetTags = () => {
    setComparedTweets({});
    setQuery([]);
  }
  return (
    <>
      <div className='flex'>

        {!isLogged && user === null ?
          <Auth /> :
          <>
            <div className='headerBlock'>
              {cookies.user && isLogged ?
                <UserInfo setIsLogged={setIsLogged} setSearchParams={setSearchParams} removeCookie={removeCookie} photo={cookies?.user?.photo} name={cookies?.user?.name} /> :
                user !== null ?
                  <span onClick={authClickHandler}>authorize</span> :
                  null
              }

              <div className='controlsContainer'>

                <form
                  className='hashtagGroup'
                  onSubmit={submitSearch}
                >
                  <input
                    className='hashtagInput'
                    type='text'
                    // disabled={!isLogged}
                    disabled={isDisabledInput()}
                    placeholder='Search filters'
                    value={searchString}
                    onChange={handleChange}
                  />
                  <button disabled={searchString === ''}>
                    {isLoading ?
                      <ButtonLoader /> :
                      <img width={20} height={20} alt='search' src={search} />
                    }
                  </button>
                </form>

                {isLogged &&
                  <div className='selectControls'>
                    <button onClick={resetTags}>reset</button> {/* add reset button */}
                    <label htmlFor="interval">Refresh interval, min</label>
                    <select value={formValues.interval} onChange={handleIntervalChange}>
                      {optionsInterval.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="count">Tweets amount</label>
                    <select value={formValues.amount} onChange={handleAmountChange}>
                      {optionsAmount.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                  </div>
                }
                <div className='tagLabels'>
                {query !== [] &&
                  query.map(item => <TagLabel key={item} setSearchParams={setSearchParams} setQuery={setQuery} query={query} tag={item} />)
                }
              </div>
              </div>
            </div>

            <div className='fixedWidth'>
              
              {comparedTweets?.data === null && !isLoading &&
                <h2>No results were found for this request... Try to change the filters</h2>
              }
              
              {isLoading ?
                <div className='loader'><img src={Loader} alt='loading' /></div> :
                comparedTweets?.data && comparedTweets?.data.map((tweet, ind) => {
                  if (tweet === null) return null
                  return (
                    <Element name={ind}>
                      <Tweet
                        public_metrics={tweet?.public_metrics}
                        // referenced_tweets={tweet.referenced_tweets}
                        id={tweet?.id}
                        author={comparedTweets?.includes?.users?.find(user => user.id === tweet?.author_id)}
                        media={tweet?.attachments?.media_keys?.map(mkey => comparedTweets?.includes?.media?.find(media => mkey === media?.media_key))}
                        created_at={tweet?.created_at}
                        text={tweet?.text}
                        key={tweet?.id}
                      />
                    </Element>
                  )
                }
                )
              }
            </div>
          </>
        }
      </div>
    </>
  );
}

export default App;
