import request  from "@/utils/request";
import { compressimage } from "@/utils/compressimage";
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
    // 先压缩再转 base64，避免大图上传时请求体过大、后端内存被撑爆
    let target=file
    try{
        target=await compressimage(file) as File
    }catch{
        // 压缩失败就用原图，交给后端校验兜底
    }
    const base64=await new Promise((resolve,reject)=>{
        const reader=new FileReader()
        reader.onload=()=>{resolve(reader.result)}
        reader.onerror=()=>{reject(new Error('文件读取失败'))}
        reader.readAsDataURL(target)
    })
      return await request.post('/avatar',{avatar:base64})
}