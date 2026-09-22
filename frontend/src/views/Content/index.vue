<template>
    <div class="content-container">
        <Navigation></Navigation>
        <Nav :data="cumbs"></Nav>
       <div class="content">
        <Hottop></Hottop>
        <RouterView></RouterView>
        <component :is="isView"></component>
       </div>
    </div>
</template>

<script setup lang="ts">
import Navigation from '@/views/Content/Components/Navigation/index.vue'
import Hottop from '@/views/Content/Components/Hottop/index.vue'
import Publish from '@/views/Content/Components/Publish/index.vue'
import Message from '@/views/Content/Components/Message/index.vue'
import Nav from '@/views/Content/Components/AnotherNaviigation/index.vue'
import { useCrumbStore } from '@/stores/crumb'
import { useNotificationStore } from '@/stores/note_pub'
import { usePanelStore } from '@/stores/panle'
import { ws } from '@/utils/ws'
import type { NotificationItem } from '@/types/note'
import { getunreadnote } from '@/api/note'
import {computed,onMounted,ref} from 'vue'
const store=useCrumbStore()
const notestore=useNotificationStore()
const panlestore=usePanelStore()
const cumbs=computed(()=>(store.stack))
const list=ref<NotificationItem[]>([])
onMounted(async()=>{
    ws.connect()
    ws.onMessage((msg)=>{
        if(msg.type!=='notification' || !msg.data){
           return
        }
        notestore.add(msg.data as NotificationItem)
    })
    try{
    const res=await getunreadnote()
    if(res.status===0){
        list.value=res.data.list
        notestore.init(list.value)
    }
    }catch{
        notestore.connect=true
    }
})
const panelmap={
    publish:Publish,
    notification:Message
}
const isView=computed(()=>panelmap[panlestore.active]??Publish)
</script>

<style scoped lang="scss">
.content-container{
    width: 100%;
    height: auto;
    min-height: calc(100vh - 340px - 56px);
    position: relative;
    overflow: visible;
    z-index: 1;
    .content{
        width: 100%;
        min-height: 80%;
        display: flex;
        gap: 7%;
        margin-top: 3%;
    }
}
</style>
