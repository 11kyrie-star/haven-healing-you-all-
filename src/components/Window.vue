<template>
    <div v-if="windowstore.visible" class="window-overlay" @click.self="closewindow">
        <div class="window-card">
            <div class="window-logo" v-show="windowstore.decwindow==='information' || windowstore.decwindow==='password'">
                <div class="title">Haven</div>
                <div class="another-title">Heal all your wounds</div>
            </div>
           <div v-if="windowstore.decwindow==='img'" class="window-img">
              <img :src=userstore.userinfo.avatar?userstore.userinfo.avatar:avatarStr>
           </div>
           <div v-else-if="windowstore.decwindow==='postimg'" class="window-img">
              <img :src="windowstore.postimg">
           </div>
           <div v-else-if="windowstore.decwindow==='information'" class="window-infor">
            <div class="window-img">
                <img :src="userstore.userinfo.avatar? userstore.userinfo.avatar:avatarDefault ">
                <div class="img-button" @click="clickinput">
                <div>点击更换头像</div>
                <input type="file" ref="fileinput" accept="image/*" style="display: none;" @change="changefile">
              </div>
            </div>
            <div class="window-form">
                <el-form label-position="left" label-width="70px" label-suffix=":" :model="infoform" :rules="inforule" ref="info">
                    <el-form-item label="用户名" prop="username" class="form-label">
                        <el-input v-model="infoform.username" style="width: 85%;"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email" class="form-label">
                        <el-input v-model="infoform.email" style="width: 85%;"></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <div class="window-button">
                <el-button @click="cancel">取消</el-button>
                <el-button type="primary" @click="finish">完成</el-button>
            </div>
           </div>
           <div class="window-password" v-else-if="windowstore.decwindow==='password'">
                <div class="password-form">
                    <el-form ref="formpassword" label-position="left" label-suffix=":" label-width="70px" :model="form" :rules="rules">
                        <el-form-item label="原密码" prop="oldpassword">
                            <el-input style="width: 90%;" type="password" v-model="form.oldpassword"></el-input>
                        </el-form-item>
                        <el-form-item label="新密码" prop="newpassword">
                            <el-input style="width: 90%;" type="password" v-model="form.newpassword"></el-input>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="password-button">
                    <el-button @click="cancelpwd">取消</el-button>
                    <el-button @click="finishpwd" type="primary">完成</el-button>
                </div>
                <div class="hi">Hi~</div>  
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {reactive,ref} from 'vue'
import { useUserStore } from '@/stores/userinfo';
import { Changepassword } from '@/api/userinfo';
import { ElMessage } from 'element-plus';
import { useWindowStore } from '@/stores/window';
import avatarDefault from '@/assets/avatar.webp'
const userstore=useUserStore()
const avatarStr=avatarDefault
const formpassword=ref()
const fileinput=ref<HTMLInputElement>()
const info=ref()
const windowstore=useWindowStore()
const cancelpwd=()=>{
    windowstore.close()
    form.newpassword=''
    form.oldpassword=''
}
const clickinput=()=>{
    fileinput.value?.click()
}
const changefile=async (even:Event)=>{
const target=even.target as HTMLInputElement
const file=target.files?.[0]
const allowtype=['image/jpeg','image/png','image/gif','image/webp']
if(!file) return
if(!allowtype.includes(file?.type as string)){
    return ElMessage({
        message:'只支持 jpg/png/gif/webp 格式的图片',
        type:'warning'
    })
}
const maxsize=2*1024*1024
if(file.size>maxsize){
   return ElMessage({
        message:'图片大小不能超过2MB',
        type:'warning'
    })
}
try{
    const newfile=await compressimage(file)
    const res=await userstore.updateav(newfile as File)
    if(res){
        ElMessage({
            message:'头像更新成功',
            type:'success'
        })
    }
}catch(err){
    if(err instanceof Error && err.message==='文件读取失败'){
        return ElMessage({
            message:'文件读取失败',
            type:'warning'
        })
    }
    return
}
}
//压缩图片的函数
function compressimage(file:File){
    return new Promise((resolve)=>{
        const img=new Image()
        img.onload=()=>{
            const canvas=document.createElement('canvas')
            const ctx=canvas.getContext('2d')
            let {width,height}=img
            if(width>512 || height>512){
                const ratio=512/Math.max(width,height)
                width *=ratio
                height *=ratio
            }
            canvas.width=width
            canvas.height=height
            ctx?.drawImage(img,0,0,width,height)
            canvas.toBlob((blob)=>{
                resolve(new File([blob!],'avatar.webp',{type:'image/webp'}))
            },'image/webp',0.8)
            URL.revokeObjectURL(img.src)
        }
        img.src=URL.createObjectURL(file)
    })
}
let infoform=reactive({
    username:userstore.userinfo.username,
    email:userstore.userinfo.email
})
const inforule=reactive({
    username:[
        {
            validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
                if(!value){
                    return callback(new Error('用户名不能为空'))
                }else if(value.length>6){
                    callback(new Error('用户名长度不能超过六位'))
                }else{
                    callback()
                }
            },
            trigger:'blur'
        }
    ],
    email:[
        {type:'email',message:'邮箱格式不正确',trigger:'blur'}
    ]
})
const rules=reactive({

oldpassword:[{
    validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
         if(!value) return callback() 
               if(value.length<6){
                callback(new Error('密码至少六位'))
               }else{
                callback()
               }
    }
}],
newpassword:[{
    validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
         if(!value) return callback() 
               if(value.length<6){
                callback(new Error('密码至少六位'))
               }else{
                callback()
               }
    }
}]
})
let form=reactive({
    oldpassword:'',
    newpassword:''
})
function cancel(){
    windowstore.close()
    form.oldpassword=''
    form.newpassword=''
}
function finish(){
    let number=0
//判断用户名和密码邮箱是否被修改
info.value.validate(async (valid:boolean)=>{
    if(valid){
        if(infoform.username!==userstore.userinfo.username){
        number=1
    }
    if(infoform.email!==userstore.userinfo.email){
        number=2
    }
    if(infoform.username!==userstore.userinfo.username && infoform.email!==userstore.userinfo.email){
       number=3
    }
    if(infoform.username===userstore.userinfo.username && infoform.email===userstore.userinfo.email){
        return windowstore.close()
    }
    if(number===2){
      try{
        const judge=await userstore.updateemail(infoform.email)
        if(judge){
           return  windowstore.close()
        }
      }catch{
            return
        }
    }else if(number===1){
        try{
        const judge=await userstore.updateusername(infoform.username)
        if(judge){
            return windowstore.close()
        }
        }catch{
            return
        }
    }else if(number===3){
        try{
            const judge=await userstore.updateall(infoform)
            if(judge){
            return windowstore.close()
        }
        }catch{
            return
        }
    }
    }else{
        ElMessage({
            message:'用户名或者邮箱格式错误',
            type:'warning'
        })
    }
})    
}
function finishpwd(){
    //判断用户是否要修改密码
if(form.oldpassword && form.newpassword){
     formpassword.value.validate(async (valid:boolean)=>{
        if(valid){
            try{
              const res=await Changepassword(form)
            if(res.status===0){
              ElMessage({
                message:res.msg,
                type:'success'
              })
            windowstore.close() 
            }else{
                ElMessage({
                    message:res.msg,
                    type:'warning'
                })
            }
            }catch{
              return
            }
        }else{
            ElMessage({
                message:'密码格式错误',
                type:'warning'
            })
        }
    })
    }else{
        windowstore.close()
    }
}
const closewindow=()=>{
    windowstore.close()
}
</script>
<style scoped lang="scss">
.window-overlay{
    position: fixed;
    inset: 0;
    z-index: 12;
    background: rgba(45, 25, 35, 0.38);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    .window-card{
        max-width: fit-content;
        max-height: fit-content;
        box-shadow: 0 10px 36px rgba(60, 20, 30, 0.35);
        padding: 8px;
        position: relative;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.55);
        font-family: 'LXGW WenKai', 'Inter', sans-serif;
        background: linear-gradient(
            45deg,
            #fad0c4 0%, 
            #f7b7a3 30%,
             #c9adc6 60%, 
              #89a1c1 100% 
        );
        .window-logo{
            width: 100%;
            height: fit-content;
            position: absolute;
            left: 0;
            top: 14px;
            z-index: 2;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 2px;
            pointer-events: none;
            .title{
                font-family: 'Great Vibes', cursive;
                font-size: 1.9rem;
                font-weight: 600;
                color: rgba(60, 30, 30, 0.8);
                text-shadow: 0 1px 8px rgba(255, 255, 255, 0.75);
            }
            .another-title{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 0.72rem;
                font-weight: 400;
                letter-spacing: 1.5px;
                color: rgba(60, 30, 30, 0.5);
            }
        }
    }
    :deep(.el-form-item__label){
        color: rgba(50, 50, 50, 0.85);
        font-weight: 600;
    }
    :deep(.el-input__wrapper){
        background-color: rgba(255, 255, 255, 0.65);
        border-radius: 10px;
        box-shadow: 0 0 0 1px rgba(224, 167, 167, 0.35) inset;
        transition: box-shadow 0.25s ease;
    }
    :deep(.el-input__wrapper:hover){
        box-shadow: 0 0 0 1px rgba(224, 167, 167, 0.6) inset;
    }
    :deep(.el-input__wrapper.is-focus){
        box-shadow: 0 0 0 1.5px #ef7d8e inset, 0 0 8px rgba(255, 107, 129, 0.28);
    }
    :deep(.el-input__inner){
        color: rgba(50, 50, 50, 0.85);
    }
    :deep(.el-button){
        border-radius: 999px;
        padding: 9px 26px;
        background-color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(224, 167, 167, 0.4);
        color: rgba(50, 50, 50, 0.8);
        font-weight: 600;
        transition: all 0.25s ease;
    }
    :deep(.el-button:hover){
        color: #c6401f;
        border-color: #e7a08e;
        background-color: #ffffff;
    }
    :deep(.el-button--primary){
        background: linear-gradient(135deg, #f78c6b, #f34f67);
        border: none;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(243, 79, 103, 0.35);
    }
    :deep(.el-button--primary:hover){
        background: linear-gradient(135deg, #f78c6b, #f34f67);
        filter: brightness(1.06);
        color: #ffffff;
    }
    .window-img{
        height: fit-content;
        margin-bottom: 10px;
        .img-button{
            width: fit-content;
            background-color: whitesmoke;
            border: 1px rgb(213, 165, 165) solid;
            margin-left: 15%;
            border-radius: 5px;
            font-weight: 600;
            box-shadow: 1px 2px rgb(157, 98, 98);
            cursor: pointer;
        }
        img{
            width: 60vw;
            height: 50vw;
            object-fit: cover;
        }
    }
    .window-infor{
        width: 28vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 22px;
        padding: 74px 28px 26px;
        background: rgba(255, 255, 255, 0.42);
        border: 1px solid rgba(255, 255, 255, 0.65);
        border-radius: 14px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 6px 18px rgba(120, 60, 40, 0.12);
        backdrop-filter: blur(8px);
        animation: window-card-in 0.35s ease;
        .window-img{
            width: fit-content;
            height: fit-content;
            margin-bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            img{
                width: 108px;
                height: 108px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 4px 14px rgba(120, 60, 40, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            &:hover img{
                transform: scale(1.04);
                box-shadow: 0 6px 18px rgba(120, 60, 40, 0.28);
            }
            .img-button{
                margin: 12px 0 0;
                padding: 6px 16px;
                background: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(224, 167, 167, 0.4);
                border-radius: 999px;
                font-size: 0.85em;
                font-weight: 600;
                color: rgba(50, 50, 50, 0.75);
                box-shadow: 0 2px 8px rgba(120, 60, 40, 0.08);
                cursor: pointer;
                transition: all 0.25s ease;
                &:hover{
                    background: #ffffff;
                    color: #c6401f;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(120, 60, 40, 0.16);
                }
            }
        }
        .window-form{
            width: 100%;
            :deep(.el-form-item){
                margin-bottom: 20px;
            }
        }
        .window-button{
            display: flex;
            justify-content: center;
            gap: 16px;
        }
    }
    .window-password{
        width: 26vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        padding: 74px 30px 24px;
        background: rgba(255, 255, 255, 0.42);
        border: 1px solid rgba(255, 255, 255, 0.65);
        border-radius: 14px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 6px 18px rgba(120, 60, 40, 0.12);
        backdrop-filter: blur(8px);
        animation: window-card-in 0.35s ease;
        .password-form{
            width: 100%;
            :deep(.el-form-item){
                margin-bottom: 20px;
            }
        }
        .password-button{
            display: flex;
            justify-content: center;
            gap: 16px;
        }
    }
    .hi{
        font-family: 'Great Vibes', cursive;
        font-size: 2.6rem;
        font-weight: 500;
        color: rgba(243, 79, 103, 0.5);
        text-shadow: 0 2px 10px rgba(255, 255, 255, 0.6);
        margin-top: 2px;
    }
}
@keyframes window-card-in{
    0%{
        opacity: 0;
        transform: translateY(10px) scale(0.98);
    }
    100%{
        opacity: 1;
        transform: none;
    }
}
</style>
