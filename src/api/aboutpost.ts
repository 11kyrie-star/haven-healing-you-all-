import request from "@/utils/request";
import type { postpic,postpicdata,sendpost,tagsres,updateowntagres} from "@/types/post";
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