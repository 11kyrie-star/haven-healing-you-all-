import { getsensitivedata } from "@/api/sensitiveapi"
let word:string[]=[]
export async function loadsensitive(){
   try{
      const data=await getsensitivedata()
      word=data?.data?.words ?? []
   }catch{
      word=[]
   }
}

export function findsensitvie(html:string):boolean{
   return word.some((item)=>{return html.includes(item)})
}