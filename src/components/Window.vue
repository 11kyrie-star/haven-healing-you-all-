<template>
    <div v-if="visible" class="window-overlay" @click.self="emit('close')">
        <div class="window-card">
           <div v-show="decwindow==='img'" class="window-img">
              <img src="@/assets/avatar.jpg">
           </div>
           <div v-show="decwindow==='information'" class="window-infor">
            <div class="window-img">
                <img src="@/assets/avatar.jpg">
            </div>
            <div class="window-form">
                <el-form label-position="left" label-width="70px" label-suffix=":">
                    <el-form-item label="用户名" >
                        <el-input v-model="form.username" style="width: 85%;"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱">
                        <el-input v-model="form.email" style="width: 85%;"></el-input>
                    </el-form-item>

                </el-form>
            </div>
            <div class="window-password">
                <div class="title">修改密码</div>
                <div class="password-form">
                    <el-form label-position="left" label-suffix=":" label-width="70px">
                        <el-form-item label="原密码">
                            <el-input style="width: 85%;" type="password"></el-input>
                        </el-form-item>
                        <el-form-item label="新密码">
                            <el-input style="width: 85%;" type="password"></el-input>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
            <div class="window-button">
                <el-button>取消</el-button>
                <el-button type="primary">完成</el-button>
            </div>
           </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {reactive} from 'vue'
defineProps<{
    visible:boolean
    decwindow:string
}>()
const emit=defineEmits<{
    close:[]
}>()
const form=reactive({
    username:'',
    email:''
})
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
        height:fit-content;
        background-color: white;
        padding: 2px;
        z-index: 6;
        display: flex;
        flex-direction: column;
        gap: 2%;
        padding: 5px;
        .window-img{
            background-color: rgb(234, 170, 170);
            border-radius: 8px;
            width: 30%;
            height: 20%;
            box-shadow: 1px 2px white;
            img{
                border-radius: 8px;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        .title{
            margin-bottom: 8%;
            font-weight: 800;
        }
        .window-button{
            justify-content: center;
            display: flex;
            gap: 8%;
            margin-top: 8%;
        }
    }
}
</style>