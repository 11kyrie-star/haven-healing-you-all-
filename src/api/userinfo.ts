import request  from "@/utils/request";
import type { changepwd,changeres,changeprofile } from "@/types/user";
export async function Changepassword(data:changepwd):Promise<changeres>{
    return await request.post('/changepwd',data)
}

export async function Changeusername(username:string):Promise<changeres>{
    return await request.post('/changeusername',username)
}

export async function Changeemail(email:string):Promise<changeres>{
    return await request.post('/changeemail',email)
}

export async function Changeprofile(data:changeprofile):Promise<changeres>{
    return await request.post('/changeprofile',data)
}