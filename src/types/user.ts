export interface res{
status:number,
msg:string
}

export interface loginres<T>{
    status:number,
    msg:string,
    token:string,
    data:T
}

export interface logindata{
    username:string,
    email:string,
    avatar:string
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