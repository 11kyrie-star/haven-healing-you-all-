import axios from 'axios';
const request=axios.create({
    baseURL:'http://127.0.0.1:3007/haven',
    timeout:10000
})
request.interceptors.request.use((config)=>{
    return config
},(err)=>{
    return Promise.reject(err)
})
request.interceptors.response.use((response)=>{
    return response.data
},(err)=>{
    return Promise.reject(err)
})
export default request