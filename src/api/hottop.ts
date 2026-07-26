import axios from 'axios'
import type { hotres,hotdatares } from "@/types/hot";
const request1=axios.create({
    baseURL:'http://localhost:5173'
})
request1.interceptors.response.use((config)=>{
    return config.data
})
export  async function gethotdata():Promise<hotres<hotdatares[]>>{
    return await request1.get('/hot')
}