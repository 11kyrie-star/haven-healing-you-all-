export interface res{
status:number,
msg:string
}

// 登录成功返回的用户信息
export interface logindata{
    username:string,
    email:string,
    avatar:string | null
}

// 账号被封禁时登录返回的详情
export interface BanInfo{
    status:0,
    ban_reason:string | null,
    ban_until:string | null,
    ban_ticket:string,
    has_pending_appeal:boolean
}

export interface LoginSuccess{
    status:0,
    msg:string,
    token:string,
    data:logindata
}

export interface LoginBanned{
    status:1,
    msg:string,
    data:BanInfo
}

export interface LoginFailed{
    status:1,
    msg:string,
    data?:undefined
}

// 登录接口的三种结果：成功 / 被封禁 / 其它失败（密码错误、用户不存在）
export type LoginResponse=LoginSuccess | LoginBanned | LoginFailed

// 封禁申诉
export interface AppealForm{
    ban_ticket:string,
    appeal_reason:string
}

export interface AppealResponse{
    status:number,
    msg:string,
    data?:{
        appeal_id?:number,
        appeal_pending?:boolean
    }
}

export interface form{
    username:string,
    password:string,
    email?:string
}

export interface forgetform{
    email:string,
    newpassword:string
}

export interface changepwd{
    oldpassword:string,
    newpassword:string
}

export interface changeres{
    status:number,
    msg:string
}

export interface changeprofile{
    username:string,
    email:string
}

export interface userinfo{
    username:string,
    email:string,
    avatar:string,
    token:string,
    status:number
}

export interface updateavatar<T>{
    status:number,
    msg:string,
    data:T
}

export interface avatardata{
    avatar_url:string
}