export interface postpic<T>{
    status:number,
    msg:string,
    data:T
}

export interface postpicdata{
    url:string
}

export interface sendpost{
    status:number,
    msg:string
}

export interface tagsres{
    status:number,
    msg:string,
    data:{
        tags:string[]
    }
}

export interface updateowntagres{
    status:number,
    msg:string
}