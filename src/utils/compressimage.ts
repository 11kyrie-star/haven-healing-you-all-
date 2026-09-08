export function compressimage(file:File){
return new Promise((resolve)=>{
        const img=new Image()
        img.onload=()=>{
            const canvas=document.createElement('canvas')
            const ctx=canvas.getContext('2d')
            let {width,height}=img
            if(width>1280 || height>1280){
               const ratio=1280/Math.max(width,height)
               width*=ratio
               height*=ratio
            }
            canvas.width=width
            canvas.height=height
            ctx?.drawImage(img,0,0,width,height)
            canvas.toBlob((blob)=>{
                resolve(new File([blob!],'avatar.webp',{type:'webp/image'}))
            },'image/webp',0.8)
            URL.revokeObjectURL(img.src)
        }
        img.src=URL.createObjectURL(file)
    })
}