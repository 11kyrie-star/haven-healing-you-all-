import request from "@/utils/request";
import { type res,type loginres,type form,type forgetform,type logindata } from "@/types/user";
export async function LoginApi(data:form):Promise<loginres<logindata>>{
    return await request.post('/login',data)
}
export async function RegisterApi(data:form):Promise<res>{
    return await request.post('/register',data)
}
export async function ForgetApi(data:forgetform):Promise<res>{
    return await request.post('/forget',data)
}