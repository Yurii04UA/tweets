import React from 'react'
import axios from 'axios';

import Logout from '../assets/log-out.svg'

const UserInfo = (props) => {
  const logOutHandler = async () => {
    await axios
      .get(`/api/logout`)
      .then((res) => {
        props.setSearchParams({})
        props.removeCookie('user')
        props.removeCookie('tokens')
        props.setIsLogged(false)
      })
  }
  return (
    <div className='userContainer'>
      
        <img src={props.photo} alt='user' />
        <span>{props.name}</span>
        <img onClick={logOutHandler} className='logout' src={Logout} alt='logout' />
    </div>
  )
}

export default UserInfo