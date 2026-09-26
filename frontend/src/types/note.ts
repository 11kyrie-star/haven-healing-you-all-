export type NotificationType = 'like' | 'comment' | 'reply' | 'message' | 'report_result'

export interface NotificationItem {
    id: number
    type: NotificationType
    is_read: boolean
    create_at: string
    actor_name: string
    actor_avatar: string | null
    content: string
    target_id: number
    post: {
        id: number
        username: string
        avatar: string
        content: string
        images?: string[]
    },
    reasons?:string[],
    handle_result?:string,
    is_success?:boolean,
    role?:'reporter' | 'author'
}

export interface getunreadnoteres{
    status:number,
    msg:string,
    data:{
        page:number,
        size:number,
        hasMore:boolean,
        list:NotificationItem[]
    }
}

export interface clearmsgres{
    status:number,
    msg:string,
    data:{deleted:number}
}

export interface readnoteres{
    status:number,
    msg:string,
    data:{updated:number}
}