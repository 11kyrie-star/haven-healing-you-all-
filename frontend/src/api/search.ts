import request from "@/utils/request";
import type { searchrecordres,addrecord,deleterecord,searchhotres } from "@/types/search";
import type { getpost } from "@/types/post";
export async function getsearchrecord():Promise<searchrecordres>{
    return await request.get('/search/history')
}
export async function addrecordapi(data:string):Promise<addrecord>{
    return await request.post('/search/history',{keyword:data})
}

export async function delterecordall():Promise<deleterecord>{
    return await request.delete('/search/history')
}

export async function delterecord(keyword:string):Promise<deleterecord>{
    return await request.delete(`/search/history/${keyword}`)
}

export async function searchhot():Promise<searchhotres>{
    return await request.get('/search/hot')
}

export async function gethotdata(page:number,size:number,keyword:string):Promise<getpost>{
    return await request.get('/search/hot/post',{params:{keyword,page,size}})
}

export async function getsociatepai(keyword:string):Promise<searchhotres>{
    return await request.get('/search/associate',{params:{keyword:keyword}})
}