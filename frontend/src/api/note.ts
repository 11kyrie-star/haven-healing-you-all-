import request from "@/utils/request";
import type { getunreadnoteres,clearmsgres,readnoteres } from "@/types/note";
export async function getunreadnote({page,size}:{page?:number,size?:number}={}):Promise<getunreadnoteres>{
    return await request.get('/notification/unread',{params:{page,size}})
}
export async function clear():Promise<clearmsgres>{
    return await request.delete('/notification')
}

export async function readNote():Promise<readnoteres>{
    return await request.put('/notification/read')
}