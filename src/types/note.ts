export type NotificationType = 'like' | 'comment' | 'reply' | 'message'

export interface NotificationItem {
    id: number
    type: NotificationType
    is_read: boolean
    create_at: string
    actor_name: string
    actor_avatar: string
    content: string
    target_id: number
    post: {
        id: number
        username: string
        avatar: string
        content: string
        images?: string[]
    }
}

export interface getunreadnoteres{
    status:number,
    msg:string,
    data:{
        page:number,
        size:number,
        list:NotificationItem[]
    }
}