import request from "@/utils/request";
import type { getunreadnoteres } from "@/types/note";
export async function getunreadnote():Promise<getunreadnoteres>{
    return await request.get('/notification/unread')
}