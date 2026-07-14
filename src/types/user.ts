export interface res{
status:number,
msg:string
}

export interface loginres{
    status:number,
    msg:string,
    token:string
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