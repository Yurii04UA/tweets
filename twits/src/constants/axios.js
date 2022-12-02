import axios from "axios"

console.log('process.env.REACT_APP_BACK_URL ', process.env.REACT_APP_BACK_URL)

export default axios.defaults.baseURL=process.env.REACT_APP_BACK_URL