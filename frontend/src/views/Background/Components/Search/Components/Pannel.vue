<template>
    <div class="pannel">
        <div v-if="searchstore.error" class="error-state" style="user-select: none;">
            <el-icon class="error-icon" :size="28"><WarningFilled /></el-icon>
            <div class="error-title" style="cursor: default;">网络异常</div>
            <div class="error-desc" style="cursor: default;">搜索记录和热榜加载失败，请稍后重试</div>
            <button class="retry-btn" type="button" @click="init" style="cursor: pointer;">
                <el-icon :size="14"><Refresh /></el-icon>
                <span>重新加载</span>
            </button>
        </div>
        <template v-else>
        <div class="section">
            <div class="section-head">
                <div class="section-title" style="user-select: none;">
                    <el-icon :size="15"><Clock /></el-icon>
                    <span style="cursor: default;">搜索记录</span>
                </div>
                <button class="clear-all" type="button" @click="empty">
                    <el-icon :size="13"><Delete /></el-icon>
                    <span>清空</span>
                </button>
            </div>
            <ul class="list">
                <li
                    v-for="(item, index) in searchstore.recordlist"
                    :key="item"
                    class="item"
                    :class="{ active: activeIndex === index }"
                    @mouseenter="activeRcord(index)"
                >
                    <el-icon class="item-icon" :size="14"><Clock /></el-icon>
                    <span class="label">{{ item }}</span>
                    <button class="remove" type="button" @click="deltherecord(item,index)">
                        <el-icon :size="12"><Close /></el-icon>
                    </button>
                </li>
            </ul>
            <div  class="empty" v-if="!searchstore.recordlist.length" style="user-select: none;">
                <el-icon :size="18"><Clock /></el-icon>
                <span style="cursor: default;">暂无搜索记录</span>
            </div>
        </div>

        <div class="section">
            <div class="section-head">
                <div class="section-title" style="user-select: none;">
                    <el-icon :size="15"><TrendCharts /></el-icon>
                    <span style="cursor: default;">大家都在搜</span>
                </div>
            </div>
            <ol class="list hot-list">
                <li
                    v-for="(item, index) in searchstore.hotlist"
                    :key="item.keyword"
                    class="item hot-item"
                    :class="{ active: activeIndex === searchstore.recordlist.length + index }"
                    @mouseenter="activehot( searchstore.recordlist.length + index)"
                    @click="pushdetail(item.keyword)"
                >
                    <span class="rank" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
                    <span class="label">{{ item.keyword }}</span>
                    <span v-if="index < 3" class="hot-tag" style="cursor: default;">热</span>
                </li>
            </ol>
        </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { Clock, Close, Delete, Refresh, TrendCharts, WarningFilled } from '@element-plus/icons-vue'
import { useSearchStore } from '@/stores/search';
import { onMounted,ref } from 'vue';
import { useRouter } from 'vue-router';
const searchstore=useSearchStore()
onMounted(()=>{
    searchstore.inintrecord()
    searchstore.inithot()
})
//重新加载
const init=()=>{
    searchstore.inintrecord()
    searchstore.inithot()
}
//鼠标进入对应标签激活状态
const activeIndex=ref<number | null>(null)
const activeRcord=(index:number | null)=>{
activeIndex.value=index
}
const activehot=(num:number)=>{
    activeIndex.value=num
}
//清空搜索记录
const empty=()=>{
    if(searchstore.recordlist.length===0){
        return
    }
    searchstore.deleteallrecord()
}
//删除单挑搜索记录
const deltherecord=(keyword:string,index:number)=>{
    searchstore.deltetherecord(keyword,index)
}
//点击热榜跳转
const router=useRouter()
const pushdetail=(item:string)=>{
router.push(`/layout/content/search/${item}`)
}
</script>

<style scoped lang="scss">
.pannel {
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
    .empty {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 56px;
        font-size: 0.85em;
        color: rgba(128, 128, 128, 0.7);
        background: rgba(255, 255, 255, 0.45);
        border: 1px dashed rgba(224, 167, 167, 0.35);
        border-radius: 10px;
        .el-icon {
            color: rgba(224, 128, 113, 0.7);
        }
    }
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 30px 18px;
        text-align: center;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 236, 232, 0.65));
        border: 1px solid rgba(224, 128, 113, 0.25);
        border-radius: 12px;
        .error-icon {
            color: #f34f67;
            filter: drop-shadow(0 2px 6px rgba(243, 79, 103, 0.35));
        }
        .error-title {
            font-size: 0.95em;
            font-weight: 700;
            color: rgba(120, 60, 40, 0.85);
        }
        .error-desc {
            font-size: 0.8em;
            color: rgba(128, 128, 128, 0.75);
        }
        .retry-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 6px;
            padding: 8px 20px;
            border: none;
            border-radius: 999px;
            font-family: inherit;
            font-size: 0.85em;
            color: #fff;
            background: linear-gradient(135deg, #f78c6b, #f34f67);
            box-shadow: 0 4px 12px rgba(243, 79, 103, 0.3);
            cursor: pointer;
            transition: filter 0.2s ease, transform 0.2s ease;
            &:hover {
                filter: brightness(1.06);
                transform: translateY(-1px);
            }
        }
    }
    .section {
        & + .section {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(224, 167, 167, 0.18);
        }
        .section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 6px 8px;
            .section-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.88em;
                font-weight: 700;
                color: rgba(120, 60, 40, 0.72);
                .el-icon {
                    color: rgba(224, 128, 113, 0.75);
                }
            }
            .clear-all {
                display: flex;
                align-items: center;
                gap: 4px;
                border: none;
                background: transparent;
                font-family: inherit;
                font-size: 0.78em;
                color: rgba(120, 60, 40, 0.55);
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 999px;
                transition:
                    color 0.2s ease,
                    background-color 0.2s ease;
                &:hover {
                    color: #c6401f;
                    background: rgba(219, 69, 35, 0.08);
                }
            }
        }
        .list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            .item {
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
                    .label {
                        color: #c6401f;
                        font-weight: 700;
                    }
                }
                .item-icon {
                    flex-shrink: 0;
                    color: rgba(224, 128, 113, 0.65);
                }
                .label {
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
                .remove {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    flex-shrink: 0;
                    border: none;
                    border-radius: 50%;
                    background: transparent;
                    color: rgba(120, 60, 40, 0.45);
                    cursor: pointer;
                    opacity: 0;
                    transition:
                        opacity 0.18s ease,
                        background-color 0.18s ease,
                        color 0.18s ease;
                    &:hover {
                        color: #c6401f;
                        background: rgba(219, 69, 35, 0.12);
                    }
                }
                &:hover .remove {
                    opacity: 1;
                }
            }
            .hot-item {
                .rank {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    font-size: 0.78em;
                    font-weight: 700;
                    color: rgba(128, 128, 128, 0.7);
                    background: rgba(224, 167, 167, 0.12);
                }
                .rank-1 {
                    color: #fff;
                    background: linear-gradient(135deg, #f6b73c, #f26b38);
                    box-shadow: 0 2px 8px rgba(242, 107, 56, 0.4);
                }
                .rank-2 {
                    color: #fff;
                    background: linear-gradient(135deg, #ff9a62, #f4511e);
                    box-shadow: 0 2px 8px rgba(244, 81, 30, 0.35);
                }
                .rank-3 {
                    color: #fff;
                    background: linear-gradient(135deg, #ff8b8b, #ef5da8);
                    box-shadow: 0 2px 8px rgba(239, 93, 168, 0.3);
                }
                .hot-tag {
                    flex-shrink: 0;
                    font-size: 0.7em;
                    color: #fff;
                    background: linear-gradient(135deg, #f34f67, #f78c6b);
                    border-radius: 999px;
                    padding: 2px 8px;
                    box-shadow: 0 2px 6px rgba(243, 79, 103, 0.35);
                }
            }
        }
    }
}
</style>
