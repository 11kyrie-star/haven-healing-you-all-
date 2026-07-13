export interface res{
status:string,
msg:string
}

export interface loginres{
    status:string,
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