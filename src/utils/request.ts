import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
const router=useRouter()
const request=axios.create({
    baseURL:'http://127.0.0.1:3007/haven',
    timeout:10000
})
request.interceptors.request.use((config)=>{
    const token=localStorage.getItem('token')
    if(token){
        config.headers.token=token
    }
    return config
},(err)=>{
    ElMessage.error('网络连接失败')
    return Promise.reject(err)
})
request.interceptors.response.use((response)=>{
    return response.data
},(err)=>{
    if(err.response?.status===401){
        ElMessage.error('登录已失效,请重新登录')
        router.push('/')
    }
    ElMessage.error('服务器或者网络异常')
    return Promise.reject(err)
})
export default request