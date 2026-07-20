<template>
    <div v-if="visible" class="window-overlay" @click.self="emit('close')">
        <div class="window-card">
           <div v-show="decwindow==='img'" class="window-img">
              <img :src=userstore.avatar?userstore.avatar:avatarStr>
           </div>
           <div v-show="decwindow==='information'" class="window-infor">
            <div class="window-img">
                <img :src="userstore.avatar? userstore.avatar:avatarDefault ">
            </div>
            <div class="window-form">
                <el-form label-position="left" label-width="70px" label-suffix=":" v-model="infoform" :rules="inforule" ref="info">
                    <el-form-item label="用户名" prop="username" style="margin-top: 10%;">
                        <el-input v-model="infoform.username" style="width: 85%;"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email" style="margin-top: 10%;">
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
                <div class="title">修改密码</div>
                <div class="password-form">
                    <el-form ref="formpassword" label-position="left" label-suffix=":" label-width="70px" v-model="form" :rules="rules">
                        <el-form-item label="原密码" prop="oldpassword">
                            <el-input style="width: 85%;" type="password" v-model="form.oldpassword"></el-input>
                        </el-form-item>
                        <el-form-item label="新密码" prop="newpassword">
                            <el-input style="width: 85%;" type="password" v-model="form.newpassword"></el-input>
                        </el-form-item>
                    </el-form>
                  <div class="password-button">
                    <el-button @click="cancelpwd">取消</el-button>
                    <el-button @click="finishpwd">完成</el-button>
                  </div>  
                </div>
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
const formpassowrd=ref()
const info=ref()
const cancelpwd=()=>{
    emit('close')
    form.newpassword=''
    form.oldpassword=''
}
let infoform=reactive({
    username:userstore.username,
    email:userstore.email
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
        if(infoform.username!==userstore.username){
        number=1
    }
    if(infoform.email!==userstore.email){
        number=2
    }
    if(infoform.username!==userstore.username && infoform.email!==userstore.email){
       number=3
    }
    if(number===2){
      try{
        const judge=await userstore.updateemail(infoform.email)
        if(judge){
            emit('close')
        }
      }catch{
            return
        }
    }else if(number===1){
        try{
        const judge=await userstore.updateusername(infoform.username)
        if(judge){
            emit('close')
        }
        }catch{
            return
        }
    }else if(number===3){
        try{
            const judge=await userstore.updateall(infoform)
            if(judge){
            emit('close')
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
     formpassowrd.value.validate(async (valid:boolean)=>{
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
    }
    .window-img{
        margin-bottom: 10px;
        img{
            width: 60vw;
            height: 50vw;
        }
    }
    .window-infor{
        width: 30vw;
        height:80vh;
        background-color: white;
        z-index: 6;
        display: flex;
        flex-direction: column;
        gap: 6%;
        padding: 5px;
        
        .window-img{
            background-color: rgb(234, 170, 170);
            border-radius: 8px;
            width: 33%;
            height: 25%;
            box-shadow: 1px 2px white;
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
        height: fit-content;
        width: 40vw;
        background-color: white;
        .title{
            margin-bottom: 8%;
            font-weight: 800;
        }
    }
}
</style>