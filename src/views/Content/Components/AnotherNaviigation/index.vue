<template>
    <div class="nav-container" v-show="data.length>1">
        <template v-for="(item,index) in data">
            <div class="back" :class="{current:index===data.length-1}" @click="go(item.path)">{{ item.label }}</div>
            <div v-show="index<data.length-1" style="cursor: default;">></div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.nav-container{
    display: flex;
    width: fit-content;
    height: fit-content;
    position: absolute;
    left: 31%;
    gap: 15px;
    top: 6%;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    font-size: 1.1em;
    user-select: none;
    .back{
        cursor: pointer;
        &:hover{
            font-weight: 700;
        }
        &.current{
            font-weight: 700;
        }
    }
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {ref,computed} from 'vue'
const router=useRouter()
const go=(path:string)=>{
    router.push(path)
}
const props=defineProps<{data:{label:string,path:string}[]}>()
</script>