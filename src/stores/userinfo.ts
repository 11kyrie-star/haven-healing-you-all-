import { reactive} from 'vue'
import { defineStore } from 'pinia'
import { LoginApi } from '@/api/login-register'
import { Changeusername,Changeemail ,Changeprofile} from '@/api/userinfo'
import type {  loginres,form ,logindata,changeres,changeprofile,userinfo} from '@/types/user'
import { ElMessage } from 'element-plus'

export const useUserStore=defineStore('user',()=>{
    const userinfo:userinfo=reactive({
        username:'',
         email:'',
         avatar:'',
        token:'',
        status:0
    })
    const login=async (data:form)=>{
       const res:loginres<logindata>=await LoginApi(data)
       userinfo.email=res.data.email
       userinfo.avatar=res.data.avatar
       userinfo.username=res.data.username
       userinfo.status=res.status
       userinfo.token=res.token
       if(res.status===1){
        ElMessage({
            message:res.msg,
            type:'warning'
        })
       }else{
        ElMessage({
            message:res.msg,
            type:'success'
        })
       }
    }
    const updateusername=async (data:string)=>{
        const res:changeres=await Changeusername(data)
        if(res.status===1){
            ElMessage({
                message:res.msg,
                type:'warning'
            })
            return 0
        }else{
             userinfo.username=data
            ElMessage({
                message:res.msg,
                type:'success'
            })
            return 1
        }
    }
    const updateemail=async (data:string)=>{
       const res:changeres=await Changeemail(data)
       if(res.status===1){
            ElMessage({
                message:res.msg,
                type:'warning'
            })
            return 0
        }else{
            userinfo.email=data
            ElMessage({
                message:res.msg,
                type:'success'
            })
            return 1
        }
    }
    const updateall=async(data:changeprofile)=>{
        const res:changeres=await Changeprofile(data)
        if(res.status===1){
            ElMessage({
                message:res.msg,
                type:'warning'
            })
            return 0
        }else{
            userinfo.username=data.username
            userinfo.email=data.email
            ElMessage({
                message:res.msg,
                type:'success'
            })
            return 1
        }
    }
    const logout=()=>{
        localStorage.removeItem('token')
        userinfo.username=''
        userinfo.email=''
        userinfo.avatar=''
    }
    return {
        userinfo,
        login,
        updateusername,
        updateemail,
        updateall,
        logout
    }
},{persist:{pick:['userinfo']}})
