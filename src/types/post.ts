import type { InjectionKey, ShallowRef } from "vue"

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
    msg:string,
    data:{
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
        avatar:string,
        is_liked:number
    }
}

export interface post{
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
        avatar:string,
        is_liked:number
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
    size:number,
    hasMore:boolean
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
    avatar:string,
    is_liked:number
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
    images?:string[],
    is_liked:number
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
        create_at:string,
        is_liked:number
    }
}

export interface starpostty{
    status:number,
    msg:string,
    data:{is_liked:number}
}

export interface starcommentty{
status:number,
msg:string,
data:{is_liked:number}
}

export interface postviewres{
    status:number,
    msg:string
}

export interface changepoststatusres{
    status:number,
    msg:string
}

export interface deletepostres{
    status:number,
    msg:string
}

export interface mycommentpostres{
status:number,
msg:string,
data:{
    page:number,
    size:number,
    hasMore:boolean
    list:myconmentitem[]
}
}

export interface myconmentitem{
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
    is_public:number,
    is_anonymous:number,
    created_at:string,
    username:string,
    avatar:string,
    is_liked:number,
    my_comment:{
        id:number,
        parent_id:null,
        content:string,
        images:string[],
        star_count:number,
        reply_count:number,
        create_at:string
    }
}

export interface detaildata{
    status:number,
    msg:string,
    data:{
        id:number,
        user_id:number,
        content:string,
        tags:string[],
        images:string[],
        category:string,
        view_count:number,
        like_count:number,
        comment_count:number,
        hot_value:number,
        is_public:1 | 0,
        is_anonymous:0 | 1,
        status:number,
        created_at:string,
        username:string,
        avatar:string,
        is_liked:number
    }
}
//留言功能相关数据
export interface leavewordpost{
    id:number,
    user_id:number,
    username:string,
    avatar:string,
    create_at:string,
    content:string,
    images:string[]
}


export interface leavewordres{
    status:number,
    msg:string,
    data:{
        id:number,
        post_id:number,
        sender_id:number,
        sender_username:string,
        sender_avatar:string,
        content:string,
        images:string[],
        status:number,
        create_at:string
    }
}

//获取我的留言相关数据
export interface myleaveworddata{
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
    avatar:string,
    is_liked:number,
    my_message:{
        id:number,
        content:string,
        create_at:string
    }
}

export interface myleavewordres{
    status:number,
    msg:string,
    data:{
        page:number,
        size:number,
        hasMore:boolean,
        list:myleaveworddata[]
    }
}

export interface taleaveworddata{
id:number,
content:string,
username:string,
avatar:string,
view_count:string,
like_count:number,
comment_count:number,
is_liked:number,
is_public:1 | 0,
is_anonymous:0 | 1,
tags:string[],
category:string,
created_at:string,
message:{
    id:number,
    content:string,
    create_at:string,
    sender_id:number,
    sender_username:string,
    sender_avatar:string
}
}

export interface taleavewordres{
    status:number,
    msg:string,
    data:{
        page:number,
        size:number,
        hasMore:boolean,
        list:taleaveworddata[]
    }
}