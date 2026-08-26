import request from "@/utils/request";
import type { getunreadnoteres } from "@/types/note";
export async function getunreadnote({page,size}:{page?:number,size?:number}={}):Promise<getunreadnoteres>{
    return await request.get('/notification/unread',{params:{page,size}})
}