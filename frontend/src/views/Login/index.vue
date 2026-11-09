<template>
    <div class="container">
      <div class="form">
        <div class="title">Haven</div>
        <div class="another-title">Heal all your wounds</div>
        <el-form ref="LoginformRef" :model="form" :rules="Lorules" label-position="left" label-suffix="："  label-width="80px" class="el-form" v-show="showLogin">
            <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email" v-show="showEmail">
            <el-input v-model="form.email" style="width: 80%;" class="input"></el-input>    
            </el-form-item>
            <el-form-item>
                <el-link :underline="false" type="primary" @click="forget">忘记密码?</el-link>
            </el-form-item>
            <el-form-item>
                <el-button :type=primary @click="onsubmit" class="loginin">登录</el-button>
                <el-button @click="enroll" class="register" :type="primary2">注册</el-button>
            </el-form-item>
        </el-form>
        <el-form ref="RegisterformRef" :model="form" :rules="Rerules" label-position="left" label-suffix="："  label-width="80px" class="el-form" v-show="showRegister">
            <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email" v-show="showEmail">
            <el-input v-model="form.email" style="width: 80%;" class="input"></el-input>    
            </el-form-item>
            <el-form-item>
                <el-button :type=primary @click="onsubmit" class="loginin">登录</el-button>
                <el-button @click="enroll" class="register" :type="primary2">注册</el-button>
            </el-form-item>
        </el-form>
        <el-form ref="Forform" label-suffix="：" label-width="80px" class="el-form" v-show="showForget" :model="forgetform" label-position="left" :rules="Forrules">
            <el-form-item label="邮箱" prop="email">
            <el-input v-model="forgetform.email" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newpassword">
                <el-input v-model="forgetform.newpassword" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button @click="cancelForget">取消</el-button>
                <el-button type="primary" @click="finsh" style="margin-left: 30%;">完成</el-button>
            </el-form-item>
        </el-form>
      </div>
      <aside class="intro" style="cursor: default;">
        <div class="intro-label">关于 Haven</div>
        <div class="intro-title">让每一个在意别人眼光的人，都能大胆开口。</div>
        <p class="intro-text">
          这里没有好友功能，也没有人能看到你的真实身份。你可以放心地抱怨、倾诉，把那些不好说出口的情绪留在这里。
        </p>
        <p class="intro-text">
          也许你会遇见和你一样正在经历糟糕日子的人——你会发现，自己并不孤单。撑不住的时候，也可以在这里求助。
        </p>
        <div class="intro-sign">Haven · Heal all your wounds</div>
      </aside>
    </div>
</template>

<script setup lang="ts">
import {ref,reactive} from 'vue'
import { RegisterApi,ForgetApi } from '@/api/login-register'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userinfo'
const router=useRouter()
const LoginformRef=ref()
const RegisterformRef=ref()
const showLogin=ref(true)
const showEmail=ref(false)
const showRegister=ref(false)
const showForget=ref(false)
const primary=ref<'primary'| ''>('primary')
const primary2=ref<''| 'primary'>('')
const userstore=useUserStore()

const form=reactive({
    username:'',
    password:'',
    email:''
})
const forgetform=reactive({
    email:'',
    newpassword:''
})
const Forform=ref()
//登录规则
const Lorules=reactive({
    username:[
        {
            validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
                if(!value){
                    callback(new Error('用户名不能为空'))
                }else if(value.length>6){
                    callback(new Error('用户名长度不能超过六位'))
                }else{
                    callback()
                }
            },
            trigger:'blur'
        }
    ],
    password:[
        {required:true,message:'密码不能为空',trigger:'blur'},
        {
            validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
               if(!value) return callback() 
               if(value.length<6){
                callback(new Error('密码至少六位'))
               }else{
                callback()
               }
            }
        }
    ]
})
//登录函数
const onsubmit=()=>{
    if(!showLogin.value){
        showLogin.value=true
        showRegister.value=false
    }
    if(showEmail.value){
        showEmail.value=false
    }
    if(!primary.value){
        primary.value='primary'
        primary2.value=''
    }
    if(form.username && form.password){
    LoginformRef.value.validate(async(valid:boolean)=>{
        if(valid){
           try{
           await userstore.login(form)
           if(userstore.userinfo.status===0){
            router.replace('/layout/content')
            ElMessage.success("登录成功")
           }
        }catch{
            return
           }
        }else{
            ElMessage.error('格式错误')
        }
    })
}
}

//注册的规则
const Rerules=reactive({
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
    password:[
        {required:true,message:'密码不能为空',trigger:'blur'},
        {
            validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
               if(!value) return callback() 
               if(value.length<6){
                callback(new Error('密码至少六位'))
               }else{
                callback()
               }
            }
        }
    ],
    email:[
        {required:true,message:'邮箱不能为空',trigger:'blur'},
        {type:'email',message:'邮箱格式不正确',trigger:'blur'}
    ]
})
//注册函数
const enroll=()=>{
    if(showLogin.value && !showRegister.value && !showEmail.value){
        showLogin.value=false
        showRegister.value=true
        showEmail.value=true
    }
    if(!primary2.value){
        primary.value=''
        primary2.value='primary'
    }
    if(form.username && form.password){
    RegisterformRef.value.validate(async(valid:boolean)=>{
        if(valid){
          try{  
          const res=await RegisterApi(form)
          form.password=''
          form.username=''
          form.email=''
          ElMessage({
            message:res.msg,
            type:res.status===0?'success':'warning'
          })}catch{
            return
          }
        }else{
            ElMessage({
                message:'格式错误',
                type:'warning'
            })
        }
})
    }
}

//忘记表单
//忘记密码的规则
const Forrules=reactive({
    email:[
        {type:'email',message:'邮箱格式不正确',trigger:'blur'}
    ],
    newpassword:[
        {
            validator:(rule:object,value:string,callback:(error?:string | Error)=>void)=>{
               if(!value) return callback() 
               if(value.length<6){
                callback(new Error('密码至少六位'))
               }else{
                callback()
               }
            }
        }
    ]
})
//点击忘记密码按钮
const forget=()=>{
    showLogin.value=false
    showRegister.value=false
    showForget.value=true
}
//在忘记密码表单里面点击取消
const cancelForget=()=>{
    showLogin.value=true
    showRegister.value=false
    showForget.value=false
}
//忘记表单的完成按钮
const finsh=()=>{
Forform.value.validate(async(valid:boolean)=>{
    if(valid){
        try{
        const res=await ForgetApi(forgetform)
        forgetform.email=''
        forgetform.newpassword=''
        ElMessage({
            message:res.msg,
            type:res.status===0? 'success':'warning'
        })
        showForget.value=false
        showLogin.value=true}catch{
          return
        }
    }else{
        ElMessage({
            message:'格式错误',
            type:'warning'
        })
    }
})
}
</script>

<style scoped lang="scss">
.container{
    width: 100%;
    height: 100vh;
    background: url('@/assets/login-bg.jpg') no-repeat center / cover;
    position: relative;
    .form{
        width: 25%;
        height: fit-content;
        padding:2%;
        padding-bottom: 4%;
        background-color:$login-form-bgcolor;
        opacity: 0.95;
        position: absolute;
        top: 30%;
        left: 60%;
        .loginin{
            position: absolute;
            top: 73%;
            left: 1%;
        }
        .register{
            position: absolute;
            top: 73%;
            left: 55%;
        }
        .el-form{
            margin-top: 10%;
        }
        .title{
            text-align: center;
            font-size: $login-title-fontsize;
        }
        .another-title{
            text-align: center;
            font-family: $login-another-title-fontfamily;
        }
        .input{
            --el-input-focus-border-color:grey;
            --el-input-border-color:#bdc3c7 ;
            --el-input-bg-color:#bdc3c7;
        }
    }
    .intro{
        position: absolute;
        left: 4%;
        bottom: 5%;
        width: min(32vw, 380px);
        padding: 24px 26px 18px;
        background: $glass-bg;
        backdrop-filter: $glass-blur;
        border: $glass-border-soft;
        border-radius: $radius-card;
        box-shadow: 0 8px 32px $color-warm-shadow-soft;
        font-family: var(--font-main);
        .intro-label{
            font-size: 12px;
            letter-spacing: 2px;
            color: $color-warm-text;
            margin-bottom: 10px;
        }
        .intro-title{
            font-size: 18px;
            line-height: 1.6;
            font-weight: 600;
            color: $color-ink;
            margin-bottom: 12px;
        }
        .intro-text{
            font-size: 13px;
            line-height: 1.9;
            color: $color-text-primary;
            text-align: justify;
            margin-bottom: 10px;
        }
        .intro-sign{
            margin-top: 4px;
            padding-top: 12px;
            border-top: 1px solid $color-white-light;
            font-size: 12px;
            letter-spacing: 1px;
            color: $color-warm-text;
        }
    }
    @media (max-width: 900px){
        .intro{
            display: none;
        }
    }
}
</style>