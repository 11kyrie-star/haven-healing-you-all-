import request  from "@/utils/request";
import type { changepwd,changeres,changeprofile,updateavatar,avatardata } from "@/types/user";
export async function Changepassword(data:changepwd):Promise<changeres>{
    return await request.post('/changepwd',data)
}

export async function Changeusername(username:string):Promise<changeres>{
    return await request.post('/changeusername',{username:username})
}

export async function Changeemail(email:string):Promise<changeres>{
    return await request.post('/changeemail',{email:email})
}

export async function Changeprofile(data:changeprofile):Promise<changeres>{
    return await request.post('/changeprofile',{username:data.username,email:data.email})
}

export async function Changeavatar(file:File):Promise<updateavatar<avatardata>>{
    const base64=await new Promise((resolve,reject)=>{
        const reader=new FileReader()
        reader.onload=()=>{resolve(reader.result)}
        reader.onerror=()=>{reject(new Error('文件读取失败'))}
        reader.readAsDataURL(file)
    })
      return await request.post('/avatar',{avatar:base64})
}