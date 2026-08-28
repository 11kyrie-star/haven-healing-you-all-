export interface hotres{
    status:number,
    msg:string,
    data:{
        hasMore:boolean,
        list:hotlist[]
    }
}

export interface hotlist{
    id:number,
    user_id:number,
    content:string,
    images:string[],
    tags:string[],
    category:string,
    view_count:number,
    like_count:number,
    comment_count:number,
    hot_value:string,
    is_public:number,
    is_anonymous:number,
    created_at:string,
    usrname:string,
    avatar:string,
    is_liked:number
}