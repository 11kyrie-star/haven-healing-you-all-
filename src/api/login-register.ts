import request from "@/utils/request";
export async function LoginApi(data){
    return await request.post('/login',data)
}
export async function RegisterApi(data){
    return await request.post('/register',data)
}