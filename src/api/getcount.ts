import request from "@/utils/request"
import type { countres } from "@/types/count"
export async function getcount():Promise<countres>{
    return await request.get('/stats')
}