<template>
    <div v-if="visible" class="window-overlay" @click.self="emit('close')">
        <div class="window-card">
            <div class="window-logo" v-show="decwindow!=='img'">
                <div class="title">Haven</div>
                <div class="another-title">Heal all your wounds</div>
            </div>
           <div v-show="decwindow==='img'" class="window-img">
              <img :src=userstore.userinfo.avatar?userstore.userinfo.avatar:avatarStr>
           </div>
           <div v-show="decwindow==='information'" class="window-infor">
            <div class="window-img">
                <img :src="userstore.userinfo.avatar? userstore.userinfo.avatar:avatarDefault ">
                <div class="img-button" @click="clickinput">
                <div>点击更换头像</div>
                <input type="file" ref="fileinput" accept="image/*" style="display: none;" @change="changefile">
              </div>
            </div>
            <div class="window-form">
                <el-form label-position="left" label-width="70px" label-suffix=":" :model="infoform" :rules="inforule" ref="info">
                    <el-form-item label="用户名" prop="username" style="margin-top: 10%;" class="form-label">
                        <el-input v-model="infoform.username" style="width: 85%;"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email" style="margin-top: 10%;" class="form-label">
                        <el-input v-model="infoform.email" style="width: 85%;"></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <div class="window-button">
                <el-button @click="cancel">取消</el-button>
                <el-button type="primary" @click="finish">完成</el-button>
            </div>
           </div>
           <div class="window-password" v-show="decwindow==='password'">
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
import avatarDefault from '@/assets/avatar.jpg'
const userstore=useUserStore()
const avatarStr=avatarDefault
const formpassword=ref()
const fileinput=ref<HTMLInputElement>()
const info=ref()
const cancelpwd=()=>{
    emit('close')
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
    const res=await userstore.updateav(file)
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
defineProps<{
    visible:boolean
    decwindow:string
}>()
const emit=defineEmits<{
    close:[]
}>()
let form=reactive({
    oldpassword:'',
    newpassword:''
})
function cancel(){
    emit('close')
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
        return emit('close')
    }
    if(number===2){
      try{
        const judge=await userstore.updateemail(infoform.email)
        if(judge){
           return  emit('close')
        }
      }catch{
            return
        }
    }else if(number===1){
        try{
        const judge=await userstore.updateusername(infoform.username)
        if(judge){
            return emit('close')
        }
        }catch{
            return
        }
    }else if(number===3){
        try{
            const judge=await userstore.updateall(infoform)
            if(judge){
            return emit('close')
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
            emit('close')  
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
        emit('close')
    }
}
</script>
<style scoped lang="scss">
.window-overlay{
    position: fixed;
    inset: 0;
    z-index: 3;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    .window-card{
        max-width: fit-content;
        max-height: fit-content;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 8px;
        position: relative;
        background: linear-gradient(
            45deg,
            #fad0c4 0%, 
            #f7b7a3 30%,
             #c9adc6 60%, 
              #89a1c1 100% 
        );
        .window-logo{
            width: 55%;
            height: fit-content;
            position: absolute;
            left: 43%;
            top: 10%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 1.5rem;
            font-weight: 900;
            font-family: 'Great Vibes', cursive;
        }
    }
    .window-img{
        height: fit-content;
        margin-bottom: 10px;
        .img-button{
            width: fit-content;
            background-color: whitesmoke;
            border: 1px rgb(213, 165, 165) solid;
            padding: 5%;
            margin-left: 15%;
            border-radius: 5px;
            font-weight: 600;
            box-shadow: 1px 2px rgb(157, 98, 98);
            cursor: pointer;
        }
        img{
            width: 60vw;
            height: 50vw;
        }
    }
    .window-infor{
        width: 30vw;
        height:80vh;
        z-index: 6;
        display: flex;
        flex-direction: column;
        gap: 6%;
        padding: 5px;
        .form-label{
            font-weight: 1000;
        }
        .window-img{
            background-color: rgb(234, 170, 170);
            border-radius: 8px;
            width: 33%;
            height: 25%;
            box-shadow: 1px 2px rgb(228, 165, 165);
            img{
                border-radius: 8px;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        .window-button{
            justify-content: center;
            display: flex;
            gap: 8%;
            margin-top: 8%;
        }
    }
    .window-password{
        height: 40vh;
        width: 30vw;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8%;
        .password-form{
            margin-top: 10%;
        }
        .password-button{
            display: flex;
            margin-left: 10%;
        }
    }
    .hi{
        font-family: 'Great Vibes', cursive;
        font-size: 5rem;
        font-weight: 600;
        position: absolute;
        top: 80%;
        left: 10%;
        transform: rotateX(60deg);
    }
}
</style>