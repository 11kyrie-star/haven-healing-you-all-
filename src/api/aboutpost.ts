import request from "@/utils/request";
import type { postpic,postpicdata,sendpost,tagsres,updateowntagres,getpost,comment,commentres,sendcommentres} from "@/types/post";
export async function postpicApi(file:File):Promise<postpic<postpicdata>>{
    const data=new FormData()
    data.append('image',file)
    return await request.post('/upload-image',data,{headers:{'Content-Type':'multipart/form-data'}})
}

export async function sendpostapi({content,images,is_anonymous}:{content:string,images?:string[],is_anonymous?:number}):Promise<sendpost>{
    return await request.post('/post/create',{
        content,
        images,
        is_anonymous
    })
}

export async function gettagsapi():Promise<tagsres>{
    return await request.get('/tags')
}

export async function getowntagsapi():Promise<tagsres>{
    return await request.get('/user/tags')
}

export async function updateowntag(tagList:string[]):Promise<updateowntagres>{
    return await request.put('/user/tags',{tags:tagList})
}

export async function getpostapi({page,size}:{page:number,size:number}):Promise<getpost>{
    return await request.get('/post/list',{
        params:{
            page,
            size
        }
    })
}

import axios from "axios";
const request1=axios.create({
    baseURL:'http://localhost:5173'
})
request1.interceptors.response.use((config)=>{
    return config.data
})
export async function getpostcomment():Promise<commentres<comment[]>>{
    return await request1.get('/comment')
}

export async function getpostreply():Promise<commentres<comment[]>>{
    return await request1.get('/comment2')
}

export  async function sendcomment({post_id,content,images}:{post_id:number,content:string,images:string[]}):Promise<sendcommentres>{
    return await request.post('/comment/create',{post_id,content,images})
}