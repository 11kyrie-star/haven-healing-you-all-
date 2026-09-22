<template>
    <div class="search-wrap">
        <div class="search-bar" :class="{ 'is-open': open }">
            <el-icon class="search-icon" :size="18"><Search /></el-icon>
            <input
                class="search-input"
                type="text"
                placeholder="搜索 Haven 里的内容"
                autocomplete="off"
                v-model="keyword"
                @focus="open = true"
                @input="open = true"
                @blur="noshow"
                @keyup.enter="handleSearch"
            />
        </div>

        <Transition name="dropdown">
            <Pannel v-if="open && !keyword"/>
            <div v-else-if="open && keyword" class="suggest-panel">
                <ul class="suggest-list">
                    <li
                        v-for="(item, index) in suggestList"
                        :key="item.keyword"
                        class="suggest-item"
                        :class="{ active: activeIndex === index }"
                        @mouseenter="activeIndex = index"
                        @click="pushdetail(item.keyword)"
                    >
                        <el-icon class="suggest-icon" :size="15"><Search /></el-icon>
                        <span class="suggest-label">{{ item.keyword }}</span>
                    </li>
                    <li v-if="!suggestList.length" class="suggest-empty" style="user-select: none;">
                        <el-icon :size="16"><Search /></el-icon>
                        <span style="cursor: default;">暂无匹配内容</span>
                    </li>
                </ul>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import Pannel from './Components/Pannel.vue'
import type { searchhotlist } from '@/types/search.ts';
import { getsociatepai } from '@/api/search.ts';
import { useRouter } from 'vue-router';
import { ref,watch } from 'vue';
const open=ref(false)
const keyword=ref('')
const activeIndex=ref(-1)
const suggestList=ref<searchhotlist[]>([])
let timer:ReturnType<typeof setTimeout> | null=null
watch(keyword,(newkeyword)=>{
if(timer){clearTimeout(timer)}
const text=newkeyword.trim()
if(!text){
    suggestList.value=[]
    return
}
timer=setTimeout(async()=>{
const res=await getsociatepai(keyword.value)
console.log(res)
if(res.status===0){
    suggestList.value=res.data.list
}
},300)
})
const router=useRouter()
const pushdetail=(item:string)=>{
router.push(`/layout/content/search/${item}`)
}
const noshow=()=>{
    open.value=false

}
const handleSearch=()=>{
    if(keyword.value===''){return}
    pushdetail(keyword.value)
}
</script>

<style scoped lang="scss">
.search-wrap {
    width: min(560px, 90vw);
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 5%;
    .search-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 48px;
        padding: 0 16px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(224, 167, 167, 0.4);
        box-shadow:
            0 4px 16px rgba(120, 60, 40, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
        transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
        &.is-open,
        &:focus-within {
            border-color: rgba(224, 128, 113, 0.7);
            box-shadow:
                0 0 0 2px rgba(243, 79, 103, 0.18),
                0 8px 24px rgba(224, 128, 113, 0.2);
            transform: translateY(-1px);
        }
        .search-icon {
            flex-shrink: 0;
            color: rgba(120, 60, 40, 0.45);
        }
        .search-input {
            flex: 1;
            min-width: 0;
            height: 100%;
            border: none;
            background: transparent;
            font-family: inherit;
            font-size: 0.98em;
            color: rgba(50, 50, 50, 0.85);
            &::placeholder {
                color: rgba(120, 60, 40, 0.38);
            }
        }
        .clear-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            border: none;
            border-radius: 50%;
            background: rgba(224, 167, 167, 0.25);
            color: rgba(120, 60, 40, 0.6);
            cursor: pointer;
            transition:
                background-color 0.2s ease,
                color 0.2s ease,
                transform 0.2s ease;
            &:hover {
                background: rgba(243, 79, 103, 0.16);
                color: #c6401f;
                transform: scale(1.05);
            }
        }
    }
    .suggest-panel {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        right: 0;
        max-height: 52vh;
        overflow-y: auto;
        padding: 10px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(224, 167, 167, 0.35);
        border-radius: 16px;
        box-shadow:
            0 14px 36px rgba(120, 60, 40, 0.18),
            0 4px 12px rgba(120, 60, 40, 0.08);
        font-family: 'LXGW WenKai', 'Inter', sans-serif;
        color: rgba(50, 50, 50, 0.85);
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 18px;
            right: 18px;
            height: 3px;
            border-radius: 0 0 8px 8px;
            background: linear-gradient(
                90deg,
                rgba(233, 189, 124, 0.75),
                rgba(224, 128, 113, 0.8),
                rgba(250, 130, 145, 0.65)
            );
        }
        .suggest-head {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 6px 8px;
            font-size: 0.88em;
            font-weight: 700;
            color: rgba(120, 60, 40, 0.72);
            .el-icon {
                color: rgba(224, 128, 113, 0.75);
            }
        }
        .suggest-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            .suggest-item {
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 40px;
                padding: 0 12px;
                border-radius: 10px;
                cursor: pointer;
                transition:
                    background-color 0.18s ease,
                    color 0.18s ease;
                &:hover,
                &.active {
                    background: rgba(219, 69, 35, 0.08);
                    .suggest-label {
                        color: #c6401f;
                        font-weight: 700;
                    }
                }
                .suggest-icon {
                    flex-shrink: 0;
                    color: rgba(224, 128, 113, 0.65);
                }
                .suggest-label {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.92em;
                    transition:
                        color 0.18s ease,
                        font-weight 0.18s ease;
                }
            }
            .suggest-empty {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                min-height: 56px;
                font-size: 0.85em;
                color: rgba(128, 128, 128, 0.7);
            }
        }
    }
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition:
        opacity 0.22s ease,
        transform 0.22s ease;
    transform-origin: top center;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
}
</style>
