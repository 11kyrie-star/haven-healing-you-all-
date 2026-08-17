import request from "@/utils/request";
import type { postpic,postpicdata,sendpost,tagsres,updateowntagres,getpost,comment,commentres,sendcommentres,starpostty,starcommentty, post,postviewres,changepoststatusres} from "@/types/post";
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

export async function getposthelpapi({page,size}:{page:number,size:number}):Promise<getpost>{
    return await request.get('/post/list/help',{params:{page,size}})
}

export async function getposttextapi({page,size}:{page:number,size:number}):Promise<getpost>{
    return await request.get('/post/list/text',{params:{page,size}})
}

export async function getpostdailyapi({page,size}:{page:number,size:number}):Promise<getpost>{
    return await request.get('/post/list/daily',{params:{page,size}})
}
export async function getpostcomment(postId:number,page?:number,size?:number):Promise<commentres<comment[]>>{
    return await request.get(`comment/list/${postId}`)
}

export async function getpostreply(parent_id:number,page?:number,size?:number):Promise<commentres<comment[]>>{
    return await request.get(`/reply/list/${parent_id}`)
}

export  async function sendcomment({post_id,content,images}:{post_id:number,content:string,images:string[]}):Promise<sendcommentres>{
    return await request.post('/comment/create',{post_id,content,images})
}

export async function starpost(id:number):Promise<starpostty>{
    return await request.post(`/post/${id}/like`)
}

export async function cancelstarpost(id:number):Promise<starpostty>{
    return await request.post(`/post/${id}/unlike`)
}

export async function commentstar(commentId:number):Promise<starcommentty>{
    return await request.post(`/comment/${commentId}/like`)
}

export async function cancelcomentstar(commentId:number):Promise<starcommentty>{
    return await request.post(`/comment/${commentId}/unlike`)
}

export async function sendreplyapi(parent_id:number,content:string,images?:string[]):Promise<sendcommentres>{
    return await request.post('/reply/create',{parent_id,content,images})
}

export async function addpostview(id:number):Promise<postviewres>{
    return await request.post(`/post/${id}/view`)
}

export async function getmypost({page,size}:{page:number,size:number}):Promise<getpost>{
    return await request.get('/post/list/mine',{
        params:{page,size}
    })
}

export async function changepoststatus(id:number,is_public:number):Promise<changepoststatusres>{
return await request.put(`/post/${id}/visibility`,{is_public})
}