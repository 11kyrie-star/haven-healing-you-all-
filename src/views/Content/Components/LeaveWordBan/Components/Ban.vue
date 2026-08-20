<template>
    <div class="ban-container">
        <div class="ban-title">
            <span class="title-line"></span>
            <span class="title-text">留言板</span>
            <span class="title-line"></span>
        </div>
        <div class="ban-body">
            <el-input
                v-model="content"
                type="textarea"
                :rows="4"
                maxlength="200"
                show-word-limit
                resize="none"
                placeholder="写下你想说的话吧~"
                class="ban-textarea"
            ></el-input>
            <div class="ban-footer">
                <span class="ban-tip">每一次留言，都是温柔的相遇</span>
                <el-button type="primary" class="ban-submit" :disabled="!content || content.trim().length === 0" @click="submit">
                    留言
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
const content=ref<string | null>()
const submit=()=>{
    
}
</script>

<style scoped lang="scss">
.ban-container{
    width: 100%;
    min-height: 20vh;
    padding: 18px 20px;
    background-color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(120, 60, 40, 0.06);
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    &:hover{
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(120, 60, 40, 0.12);
    }
    .ban-title{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        user-select: none;
        .title-text{
            font-size: 1.05em;
            font-weight: 700;
            letter-spacing: 2px;
            color: rgba(50, 50, 50, 0.9);
        }
        .title-line{
            width: 46px;
            height: 2px;
            border-radius: 2px;
            background: linear-gradient(90deg, transparent, rgba(243, 79, 103, 0.65), transparent);
        }
    }
    .ban-body{
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        .ban-textarea{
            :deep(.el-textarea__inner){
                background-color: rgba(255, 255, 255, 0.65);
                border-radius: 10px;
                box-shadow: 0 0 0 1px rgba(224, 167, 167, 0.35) inset;
                color: rgba(50, 50, 50, 0.85);
                font-family: 'LXGW WenKai', 'Inter', sans-serif;
                font-size: 0.95em;
                line-height: 1.6;
                padding: 10px 12px;
                transition: box-shadow 0.25s ease;
                &:hover{
                    box-shadow: 0 0 0 1px rgba(224, 167, 167, 0.6) inset;
                }
                &:focus{
                    box-shadow: 0 0 0 1.5px #ef7d8e inset, 0 0 8px rgba(255, 107, 129, 0.25);
                }
                &::placeholder{
                    color: rgba(150, 120, 120, 0.45);
                }
            }
            :deep(.el-input__count){
                background: transparent;
                color: rgba(150, 120, 120, 0.6);
                font-size: 0.75em;
            }
        }
        .ban-footer{
            display: flex;
            align-items: center;
            justify-content: space-between;
            .ban-tip{
                font-family: 'Dancing Script', cursive;
                font-size: 1.1em;
                color: rgba(243, 79, 103, 0.55);
                letter-spacing: 0.5px;
                user-select: none;
            }
            .ban-submit{
                border-radius: 999px;
                padding: 9px 30px;
                border: none;
                font-weight: 600;
                letter-spacing: 2px;
                color: #ffffff;
                background: linear-gradient(135deg, #f78c6b, #f34f67);
                box-shadow: 0 4px 12px rgba(243, 79, 103, 0.35);
                transition: all 0.25s ease;
                &:hover{
                    background: linear-gradient(135deg, #f78c6b, #f34f67);
                    filter: brightness(1.06);
                    box-shadow: 0 6px 16px rgba(243, 79, 103, 0.45);
                }
                &:active{
                    transform: translateY(1px);
                    box-shadow: 0 2px 8px rgba(243, 79, 103, 0.35);
                }
                &.is-disabled{
                    background: linear-gradient(135deg, rgba(247, 140, 107, 0.5), rgba(243, 79, 103, 0.5));
                    box-shadow: none;
                }
            }
        }
    }
}
</style>
