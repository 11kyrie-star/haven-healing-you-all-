import { defineStore } from "pinia";
import {ref} from 'vue'
export const usePanelStore=defineStore('panel',()=>{
const active=ref<'publish' | 'notification'>('publish')
const setpanle=(name:'publish' | 'notification')=>{
    active.value=name
}
return {active,setpanle}
},{persist:true})