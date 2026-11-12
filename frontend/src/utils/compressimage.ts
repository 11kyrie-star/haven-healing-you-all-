export function compressimage(file:File){
	return new Promise((resolve,reject)=>{
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
                URL.revokeObjectURL(img.src)
                if(!blob){
                    reject(new Error('图片压缩失败'))
                    return
                }
                resolve(new File([blob],'avatar.webp',{type:'image/webp'}))
            },'image/webp',0.8)
        }
        img.onerror=()=>{
            URL.revokeObjectURL(img.src)
            reject(new Error('图片读取失败'))
        }
        img.src=URL.createObjectURL(file)
    })
}
