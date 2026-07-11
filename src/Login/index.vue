<template>
    <div class="container">
      <div class="form">
        <div class="title">Haven</div>
        <div class="another-title">Heal all your wounds</div>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="left" label-suffix="："  label-width="80px" class="el-form">
            <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" style="width: 80%;" class="input"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onsubmit" style="margin-right: 37%;">登录</el-button>
                <el-button @click="enroll">注册</el-button>
            </el-form-item>
        </el-form>
      </div>
    </div>
</template>

<script setup lang="ts">
import {ref,reactive} from 'vue'
const formRef=ref()
const form=reactive({
    username:'',
    password:''
})
const rules=reactive({
    username:[
        {
            validator:(rule,value,callback)=>{
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
        {require:true,message:'密码不能为空',trigger:'blur'},
        {
            validator:(rule,value,callback)=>{
               if(value.length<6){
                callback(new Error('密码至少六位'))
               }else{
                callback()
               }
            }
        }
    ]
})
const onsubmit=()=>{
    formRef.value.validate((valid:boolean)=>{
        if(valid){

        }
    })
}
const enroll=()=>{
    formRef.value.validate((valid:boolean)=>{
        if(valid){

        }
    })
}
</script>

<style scoped lang="scss">
.container{
    width: 100%;
    height: 100vh;
    background: url('../assets/login-bg.jpg') no-repeat center / cover;
    position: relative;
    .form{
        width: 25%;
        height: fit-content;
        padding:2%;
        background-color: white;
        opacity: 0.9;
        position: absolute;
        top: 25%;
        left: 60%;
        .el-form{
            margin-top: 10%;
        }
        .title{
            text-align: center;
            font-size: 35px;
        }
        .another-title{
            text-align: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .input{
            --el-input-focus-border-color: grey;
            --el-input-border-color: #bdc3c7;
            --el-input-bg-color: #bdc3c7;
        }
    }
}
</style>