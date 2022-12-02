import React from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import * as Scroll from "react-scroll";
import {
  Link,
  Button,
  Element,
  Events,
  animateScroll as scroll,
  scrollSpy,
  scroller,
} from "react-scroll";
import Tweet from "./components/Tweet";

import "./App.css";

import search from "./assets/searchWhite.svg";
import TagLabel from "./components/TagLabel";
import ButtonLoader from "./components/ButtonLoader";
import Auth from "./components/Auth";

import Loader from "./assets/circlesLoader.gif";
import UserInfo from "./components/UserInfo";
import {
  OPTIONS_AMOUNT,
  OPTIONS_INTERVAL,
  SPECIAL_CHARACTERS,
} from "./constants";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cookies, setCookie, removeCookie] = useCookies();
  const [formValues, setFormValues] = useState({
    amount: OPTIONS_AMOUNT[9].value,
    interval: OPTIONS_INTERVAL[0].value,
  });
  const initialQuery = searchParams.get("filters");
  const oauth_token = searchParams.get("oauth_token");
  const oauth_verifier = searchParams.get("oauth_verifier");
  const user = searchParams.get("user");
  const [tweets, setTweets] = useState({});
  const [comparedTweets, setComparedTweets] = useState({});
  const [searchString, setSearchString] = useState("");
  const [query, setQuery] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(!!cookies.tokens);
  const [firstRender, setFirstRender] = useState(true);
  const [inputError, setInputError] = useState(false);
  const [requestError, setRequestError] = useState(false);

  const getConsole = () => {
    console.log("tweets: ", tweets);
    console.log("comparedTweets: ", comparedTweets);
    console.log("query: ", query);
    console.log("firstRender: ", firstRender);
  };

  // set errors
  const setError = () => {
    setSearchString("");
    setInputError(true);
  };
  // input validation/ need to optimize
  const checkInput = () => {
    console.log("check");
    setInputError(false);
    let withoutGap = searchString.replaceAll(" ", "");
    let at = withoutGap.split("").filter((e) => e === "@");
    let hash = withoutGap.split("").filter((e) => e === "#");
    let atIndex = withoutGap.split("").findIndex((e) => e === "@");
    let hashIndex = withoutGap.split("").findIndex((e) => e === "#");
    let atAndHash = at.length && hash.length;
    if (withoutGap) {
      if (query.find((e) => e === withoutGap)) {
        setError();
        return;
      }
      if (atIndex !== 0 && atIndex > 0) {
        setError();
        return;
      }
      if (hashIndex !== 0 && hashIndex > 0) {
        setError();
        return;
      }
      if (atAndHash) {
        setError();
        return;
      }
      if (at.length > 1 || hash.length > 1) {
        setError();
        return;
      }
      if (at.length === 1 && withoutGap.length === 1) {
        setError();
        return;
      }
      if (hash.length === 1 && withoutGap.length === 1) {
        setError();
        return;
      }
      if (SPECIAL_CHARACTERS.test(String(withoutGap))) {
        // setError();
        console.log(SPECIAL_CHARACTERS.test(String(withoutGap)));
        // return;
      }
      if (
        withoutGap.includes("!") ||
        withoutGap.includes("$") ||
        withoutGap.includes("%")
      ) {
        setError();
        return;
      }
      if (
        withoutGap.includes("^") ||
        withoutGap.includes("&") ||
        withoutGap.includes("*")
      ) {
        setError();
        return;
      }
      setQuery((prev) => prev.concat(withoutGap));
      setSearchString("");
    } else {
      setSearchString("");
    }
  };
  ///

  /// set tweets
  const getTwents = () => {
    if (query.length > 0) {
      setIsLoading(true);
      const changedQueries = query.map((q) => {
        return `${!q.includes("#") && !q.includes("@") ? "#" : ""}${q.replace(
          "@",
          "from:",
        )}`;
      });
      const filtersNew = changedQueries.join(" OR ");

      // const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
      const amount = formValues.amount;
      axios
        .get("/api/recent-api", {
          params: { filters: filtersNew, amount },
        })
        .then((res) => {
          setIsLoading(false);
          setSearchParams({
            ...searchParams,
            filters: filtersNew,
            user: cookies?.user?.id_str,
            amount,
          });
          setTweets(res.data);
          // new
          if (res.data.length) {
            console.log("there is nothing");
          }
          console.log(res);
        })
        .catch((e) => {
          // error handling
          setIsLoading(false);
          setRequestError(true);
          setSearchString("");
          let newArr = [...query];
          newArr.pop();
          setQuery(newArr);
          console.log(e);
        });
    }
  };
  ///
  const handleAmountChange = ({ target: { value } }) => {
    setFormValues({ ...formValues, amount: value });
    setComparedTweets(tweets);
  };
  const handleIntervalChange = ({ target: { value } }) => {
    setFormValues({ ...formValues, interval: value });
  };

  useEffect(() => {
    if (
      !(
        tweets?.data?.length === comparedTweets?.data?.length &&
        tweets?.data
          ?.map((tweet) => tweet?.text)
          .every(
            (value, index) =>
              value ===
              comparedTweets?.data?.map((tweet) => tweet?.text)[index],
          )
      )
    ) {
      console.log("setcomp");
      setComparedTweets(tweets);
    }
  }, [tweets]);

  useEffect(() => {
    query.length === 0 && setTweets({});
  }, [query]);

  useEffect(() => {
    if (cookies.tokens) {
      axios
        .post("/api/me", {
          accessToken: cookies.tokens.accessToken,
          accessSecret: cookies.tokens.accessSecret,
        })
        .then((res) => {
          setIsLogged(true);
        })
        .catch(() => setIsLogged(false));
    }
  }, []);

  useEffect(() => {
    if (initialQuery === " " || initialQuery === "#") setSearchParams({});
  }, [initialQuery]);

  useEffect(() => {
    if (oauth_token !== null) {
      axios
        .get("/api/callback", {
          params: {
            oauth_token: oauth_token,
            oauth_verifier: oauth_verifier,
          },
        })
        .then((res) => {
          setCookie("user", {
            name: res.data.user.name,
            photo: res.data.user.profile_image_url_https,
            id_str: res.data.user.id_str,
          });
          setCookie("tokens", {
            accessToken: res.data.accessToken,
            accessSecret: res.data.accessSecret,
          });
          setIsLogged(true);
        })
        .catch(() => setIsLogged(false));
    }
  }, [oauth_token]);

  const handleChange = (e) => {
    setSearchString(e.target.value);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setInputError(false);
    setRequestError(false);
    checkInput();
  };

  useEffect(() => {
    getTwents();
  }, [query.length, formValues.amount]); // rerender if we change amount

  useEffect(() => {
    if (isLogged) {
      searchParams.delete("oauth_token");
      searchParams.delete("oauth_verifier");
      setSearchParams(searchParams);
      setIsLoading(true);
      axios
        .get("/api/recent", {})
        .then((res) => {
          setIsLoading(false);
          setTweets(res.data);
        })
        .catch((e) => {
          setIsLoading(false);
        });
    }
  }, [isLogged]);

  useEffect(() => {
    if (!isLogged && user !== null) {
      const intID = setInterval(
        (function recentCallback() {
          axios
            .get(`/api/recent?user=${user}`, {})
            .then((res) => {
              setIsLoading(false);
              setTweets(res.data);
            })
            .catch((e) => {
              setIsLoading(false);
            });
        })(),
        formValues.interval * 60000,
      );
      return () => clearInterval(intID);
    }
  }, [isLogged, user]);

  useEffect(() => {
    if (isLogged && comparedTweets?.data?.length > 0 && query.length === 0) {
      const intervalId = window.setInterval(() => {}, 0);

      for (let i = 1; i <= intervalId; i++) {
        window.clearInterval(i);
      }
      const intID = setInterval(() => {
        axios
          .get("/api/recent", {})
          .then((res) => {
            setIsLoading(false);
            setTweets(res.data);
          })
          .catch((e) => {
            setIsLoading(false);
          });
      }, formValues.interval * 60000);
      return () => clearInterval(intID);
    }
  }, [isLogged, query.length, comparedTweets]);

  // scrolling feed
  useEffect(() => {
    if (!isLogged) {
      if (comparedTweets?.data?.length > 0) {
        let ind = 0;
        const intv = setInterval(() => {
          ind < comparedTweets?.data?.length - 1 ? ind++ : (ind = 0);
          scroller.scrollTo(ind.toString(), {
            duration: 3500,
            offset: -175,
            delay: 0,
            smooth: true,
          });
        }, 5500);
        // window.addEventListener('scroll', clearInterval(intv))

        if (ind === comparedTweets.length - 1) {
          clearInterval(intv);
        }
        return () => {
          clearInterval(intv);
          // window.removeEventListener('scroll', clearInterval(intv))
        };
      }
    }
  }, [comparedTweets]);

  const recentApiIntervalCallback = () => {
    // const filters = `${query.filter(item => !item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => !item.includes('@')).length > 0 ? query.filter(item => !item.includes('@')).map(hashtag => !hashtag.includes('#') ? `#${hashtag}` : hashtag).join(' OR ') : ''}${query.filter(item => !item.includes('@')).length > 1 ? ')' : ''}${query.filter(item => item.includes('@')).length > 0 && query.filter(item => !item.includes('@')) ? ' ' : ''}${query.filter(item => item.includes('@')).length > 1 ? '(' : ''}${query.filter(item => item.includes('@')).length > 0 ? (query.filter(item => item.includes('@')).join(' OR ').replaceAll('@', 'from:')) : ''}${query.filter(item => item.includes('@')).length > 1 ? ')' : ''}`
    const changedQueries = query.map((q) => {
      return `${!q.includes("#") && !q.includes("@") ? "#" : ""}${q.replace(
        "@",
        "from:",
      )}`;
    });
    const filtersNew = changedQueries.join(" OR ");
    const amount = formValues.amount;
    axios
      .get("/api/recent-api", {
        params: { filters: filtersNew, amount },
      })
      .then((res) => {
        setIsLoading(false);
        setSearchParams({
          ...searchParams,
          filters: filtersNew,
          user: cookies?.user?.id_str,
          amount,
        });
        setTweets(res.data);
      })
      .catch((e) => {
        setIsLoading(false);
      });
    // return apiIntCallback;
    console.log("recentApiIntervalCallback executed");
  };

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false);
    } else {
      if (query.length !== 0) {
        const intervalId = window.setInterval(() => {}, 0);

        for (let i = 1; i <= intervalId; i++) {
          window.clearInterval(i);
        }
        const apiInt = setInterval(
          recentApiIntervalCallback,
          formValues.interval * 60000,
        );
        return () => clearInterval(apiInt);
      }
      // else if (query.length === 0 && initialQuery !== null && isLogged) {
      //   setQuery(initialQuery.split(' ').filter(query => query !== ' ' && query !== '#' && query !== 'OR').map(item => item.replace('(', '').replace(')', '')))
      // }
    }
  }, [query, formValues?.amount, firstRender, formValues?.interval]);

  const clearIntervals = () => {
    const intervalId = window.setInterval(() => {}, 0);

    for (let i = 1; i <= intervalId; i++) {
      window.clearInterval(i);
    }
  };
  const authClickHandler = async () => {
    await axios
      .get(`/api/token-request`)
      .then((res) => (window.location.href = res.data.url));
  };

  //disabled input if no logged and query more 10
  const isDisabledInput = () => {
    if (!isLogged || query.length > 9) {
      return true;
    }
    return false;
  };

  const resetTags = () => {
    setComparedTweets({});
    setQuery([]);
    setInputError(false);
    setRequestError(false);
  };
  /// for testing
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pubUrl, setPubUrl] = useState("");
  const copyURL = () => setUrl(window.location.href);
  const createPublishURL = () => {
    const encoded = encodeURI(url);
    setPubUrl(encoded);
  };
  return (
    <>
      <div className="flex">
        {/* for testing */}
        <div style={{
            position: "absolute",
            right: "150px",
            width: "400px",
            // width: "800px",
            }}>
          <button onClick={() =>setOpen(!open)}>for testing</button>
          <div
            style={{
              background: "#fff",
              overflow: "auto",
              visibility: open ? "visible" : "hidden",
            }}
          >
            <button onClick={getTwents}>refresh</button>{" "}
            <button onClick={recentApiIntervalCallback}>refresh2</button>{" "}
            <button onClick={getConsole}>console</button>
            <button onClick={copyURL}>copy url</button>
            <button onClick={createPublishURL}>create publish url</button>
            <p>{url}</p>
            <p>{pubUrl}</p>
          </div>
        </div>

        {/* /// */}

        {!isLogged && user === null ? (
          <Auth />
        ) : (
          <>
            <div className="headerBlock">
              {cookies.user && isLogged ? (
                <UserInfo
                  setIsLogged={setIsLogged}
                  setSearchParams={setSearchParams}
                  removeCookie={removeCookie}
                  photo={cookies?.user?.photo}
                  name={cookies?.user?.name}
                />
              ) : user !== null ? (
                <span onClick={authClickHandler}>authorize</span>
              ) : null}

              <div className="controlsContainer">
                <form className="hashtagGroup" onSubmit={submitSearch}>
                  <input
                    className="hashtagInput"
                    style={{
                      border: `${
                        inputError || requestError ? "1px solid red" : "none"
                      }`,
                    }}
                    type="text"
                    maxLength={51}
                    disabled={isDisabledInput()}
                    placeholder="Search filters"
                    value={searchString}
                    onChange={handleChange}
                  />

                  <button disabled={searchString === ""}>
                    {isLoading ? (
                      <ButtonLoader />
                    ) : (
                      <img width={20} height={20} alt="search" src={search} />
                    )}
                  </button>
                </form>
                {inputError && (
                  <div className="inputError">enter a valid request</div>
                )}
                {requestError && (
                  <div className="inputError">no results...</div>
                )}
                {isLogged && (
                  <div className="selectControls">
                    <button onClick={resetTags}>reset</button>{" "}
                    {/* add reset button */}
                    <label htmlFor="interval">Refresh interval, min</label>
                    <select
                      value={formValues.interval}
                      onChange={handleIntervalChange}
                    >
                      {OPTIONS_INTERVAL.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="count">Tweets amount</label>
                    <select
                      value={formValues.amount}
                      onChange={handleAmountChange}
                    >
                      {OPTIONS_AMOUNT.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="tagLabels">
                  {query !== [] &&
                    query.map((item) => (
                      <TagLabel
                        key={item}
                        setSearchParams={setSearchParams}
                        setQuery={setQuery}
                        query={query}
                        tag={item}
                      />
                    ))}
                </div>
              </div>
            </div>

            <div className="fixedWidth">
              {comparedTweets?.data === null && !isLoading && (
                <h2>
                  No results were found for this request... Try to change the
                  filters
                </h2>
              )}

              {isLoading ? (
                <div className="loader">
                  <img src={Loader} alt="loading" />
                </div>
              ) : (
                comparedTweets?.data &&
                comparedTweets?.data.map((tweet, ind) => {
                  if (tweet === null) return null;
                  return (
                    <Element name={ind}>
                      <Tweet
                        public_metrics={tweet?.public_metrics}
                        // referenced_tweets={tweet.referenced_tweets}
                        id={tweet?.id}
                        author={comparedTweets?.includes?.users?.find(
                          (user) => user.id === tweet?.author_id,
                        )}
                        media={tweet?.attachments?.media_keys?.map((mkey) =>
                          comparedTweets?.includes?.media?.find(
                            (media) => mkey === media?.media_key,
                          ),
                        )}
                        created_at={tweet?.created_at}
                        text={tweet?.text}
                        key={tweet?.id}
                      />
                    </Element>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default App;
