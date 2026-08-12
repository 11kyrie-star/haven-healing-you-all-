import {http,HttpResponse} from 'msw'
interface commentdata{
    id:number,
    post_id:number
    user_id:number,
    parent_id:number | null
    avatar:string,
    username:string,
    content:string,
    create_at:string,
    star_count:number,
    reply_count:number,
}

const fakecomment:commentdata[]=[{
    id:1,
    post_id:1,
    user_id:1,
    parent_id:null,
    avatar:'@/assets/avatar.jpg',
    username:'kyrie',
    content:'非常的nice',
    create_at:'前天 18:00',
    star_count:100,
    reply_count:1000
},{
    id:2,
    post_id:2,
    user_id:2,
    parent_id:null,
    avatar:"@/assets/avatar.jpg",
    username:'一诺',
    content:'挺厉害的',
    create_at:'昨天 18:00',
    star_count:1000,
    reply_count:100}]

const fakecomment2:commentdata[]=[{
    id:3,
    post_id:3,
    user_id:3,
    parent_id:2,
    avatar:'@/assets/avatar.jpg',
    username:'鞠婧祎',
    content:'超级漂亮',
    create_at:'18:00',
    star_count:100,
    reply_count:200
}]
export const handlecomment=[
    http.get('/comment',()=>{
        return HttpResponse.json({
            status:0,
            msg:'获取成功',
            data:fakecomment
        })
    }),http.get('/comment2',()=>{
        return HttpResponse.json({
            status:0,
            msg:'获取成功',
            data:fakecomment2
        })
    })
]
