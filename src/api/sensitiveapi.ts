import request from "@/utils/request";
import type {res} from '@/types/sensitive'
export async function getsensitivedata():Promise<res>{
    return await request.get('/sensitive-words')
}