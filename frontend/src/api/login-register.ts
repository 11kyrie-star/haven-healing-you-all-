import request from "@/utils/request";
import { type res,type LoginResponse,type form,type forgetform,type AppealForm,type AppealResponse } from "@/types/user";
export async function LoginApi(data:form):Promise<LoginResponse>{
    return await request.post('/login',data)
}
export async function RegisterApi(data:form):Promise<res>{
    return await request.post('/register',data)
}
export async function ForgetApi(data:forgetform):Promise<res>{
    return await request.post('/forget',data)
}
export async function SubmitAppealApi(data:AppealForm):Promise<AppealResponse>{
    return await request.post('/appeal',data)
}
