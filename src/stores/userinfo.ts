import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { LoginApi } from '@/api/login-register'
import { Changeusername,Changeemail ,Changeprofile} from '@/api/userinfo'
import type {  loginres,form ,logindata,changeres,changeprofile} from '@/types/user'
import { ElMessage } from 'element-plus'

export const useUserStore=defineStore('user',()=>{
    const username=ref<string>('')
    const email=ref<string>('')
    const avatar=ref<string>('')
    const status=ref<number>()
    const msg=ref<string>('')
    const token=ref<string | null>(localStorage.getItem('token'))
    const isLogin=computed(()=>{
        return token.value!=''
    })
    const login=async (data:form)=>{
       const res:loginres<logindata>=await LoginApi(data)
       token.value=res.token
       msg.value=res.msg
       status.value=res.status
       email.value=res.data.email
       avatar.value=res.data.avatar
       username.value=res.data.username
       localStorage.setItem('token',res.token)
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
            username.value=data
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
            email.value=data
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
            username.value=data.username
            email.value=data.email
            ElMessage({
                message:res.msg,
                type:'success'
            })
            return 1
        }
    }
    return {
        username,
        email,
        avatar,
        status,
        msg,
        token,
        isLogin,
        login,
        updateusername,
        updateemail,
        updateall
    }
})
