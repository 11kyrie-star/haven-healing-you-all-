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

interface getpostRes<T>{
status:number,
msg:string,
data:T
}

interface getpostdata{
    list:postitem[],
    page:number,
    size:number
}

export interface postitem{
    id:number,
    user_id:number,
    content:string,
    images:string[],
    tags:string[],
    category:string,
    view_count:number,
    like_count:number,
    comment_count:number,
    hot_value:number,
    is_public:1 | 0,
    is_anonymous:0 | 1,
    created_at:string,
    username:string,
    avatar:string
}

export type getpost=getpostRes<getpostdata>

export interface comment{
    id:number,
    post_id:number,
    user_id:number,
    parent_id:null | number,
    avatar:string,
    username:string,
    content:string,
    create_at:string,
    star_count:number,
    reply_count:number,
    images?:string[]
}

export interface commentres<T>{
    status:number,
    msg:string,
    data:T
}

export interface sendcommentres{
    status:number,
    msg:string,
    data?:{
        id:number,
        post_id:number,
        parent_id:number,
        user_id:number,
        username:string,
        avatar:string,
        content:string,
        images?:string[],
        star_count:number,
        reply_count:number,
        create_at:string
    }
}