import request from "@/utils/request"
import type { countres } from "@/types/count"
export function getcount():Promise<countres>{
    return request.get('/stats')
}