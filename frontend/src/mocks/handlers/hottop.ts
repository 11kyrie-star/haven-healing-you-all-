import {http,HttpResponse} from 'msw'
interface hotdata{
    id:number,
    post:string,
    hot:number,
    tag:string
}
const fakedata:hotdata[]=[
    {id:1,post:'凯里欧文好帅啊',hot:100,tag:'偶像'},
    {id:2,post:'李诗雅好漂亮',hot:99,tag:'动漫'},
    {id:3,post:'徐必成无敌',hot:90,tag:'电竞'},
    {id:4,post:'王者让我赢吧',hot:89,tag:'崩溃'},
    {id:5,post:'萧炎终将成为斗帝',hot:80,tag:'国漫男主'},
    {id:6,post:'今天又是美好的一天',hot:78,tag:'积极'},
    {id:7,post:'能不能赐予我一个女朋友',hot:61,tag:'求偶'},
    {id:8,post:'好好学习前端',hot:60,tag:'学习'},
    {id:9,post:'高考加油',hot:55,tag:'高考'},
    {id:10,post:'今天健身了吗？',hot:50,tag:'自律打卡'}
]

export const handlehot=[
    http.get('/hot',()=>{
        return HttpResponse.json({
            status:0,
            msg:'获取成功',
            data:fakedata
        })
    })
]