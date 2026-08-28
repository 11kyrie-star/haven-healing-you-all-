import request from "@/utils/request";
import type { hotres } from "@/types/hot";
export async function gethotdata():Promise<hotres>{
return await request.get('/post/list/hot')
}