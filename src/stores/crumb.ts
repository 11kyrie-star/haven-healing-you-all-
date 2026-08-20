import { defineStore } from "pinia";
export const useCrumbStore=defineStore('crumb',{
    state:()=>({stack:[] as {label:string;path:string}[]}),
    persist:true
})