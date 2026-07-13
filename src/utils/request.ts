import axios from 'axios';
import { ElMessage } from 'element-plus';
const request=axios.create({
    baseURL:'http://127.0.0.1:3007/haven',
    timeout:10000
})
request.interceptors.request.use((config)=>{
    return config
},(err)=>{
    ElMessage.error('网络连接失败')
    return Promise.reject(err)
})
request.interceptors.response.use((response)=>{
    return response.data
},(err)=>{
    ElMessage.error('服务器或者网络异常')
    return Promise.reject(err)
})
export default request