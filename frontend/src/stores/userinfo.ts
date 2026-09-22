import { ref} from 'vue'
import { defineStore } from 'pinia'
import { LoginApi } from '@/api/login-register'
import { Changeusername,Changeemail ,Changeprofile,Changeavatar} from '@/api/userinfo'
import type {  loginres,form ,logindata,changeres,changeprofile,userinfo,updateavatar,avatardata} from '@/types/user'
import { ElMessage } from 'element-plus'
import router from '@/router'

export const useUserStore=defineStore('user',()=>{
    const userinfo=ref<userinfo>({
         username:'',
         email:'',
         avatar:'',
         token:'',
         status:0
    })
    const login=async (data:form)=>{
       const res:loginres<logindata>=await LoginApi(data)
       if(res.status===1){
        ElMessage({
            message:res.msg,
            type:'warning'
        })
        return
       }else{
        ElMessage({
            message:res.msg,
            type:'success'
        })
       }
       userinfo.value.email=res.data.email
       userinfo.value.avatar=res.data.avatar
       userinfo.value.username=res.data.username
       userinfo.value.status=res.status
       userinfo.value.token=res.token
      localStorage.setItem('token', res.token)
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
             userinfo.value.username=data
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
            userinfo.value.email=data
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
            userinfo.value.username=data.username
            userinfo.value.email=data.email
            ElMessage({
                message:res.msg,
                type:'success'
            })
            return 1
        }
    }
    const logout=()=>{
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        router.replace('/')
    }
    const updateav=async (file:File)=>{
      const res:updateavatar<avatardata>=await Changeavatar(file)
      if(res.status===1){
         console.log(res)
         ElMessage({
            message:res.msg,
            type:'warning'
        })
        return 0
      }
      userinfo.value.avatar=res.data.avatar_url
      return 1
    }
    return {
        userinfo,
        login,
        updateusername,
        updateemail,
        updateall,
        logout,
        updateav
    }
},{persist:{pick:['userinfo']}})
