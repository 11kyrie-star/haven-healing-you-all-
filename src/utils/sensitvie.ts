import { getsensitivedata } from "@/api/sensitiveapi"
let word:string[]=[]
export async function loadsensitive(){
   const data=await getsensitivedata()
   word=data.data.words
}

export function findsensitvie(html:string):boolean{
   return word.some((item)=>{return html.includes(item)})
}