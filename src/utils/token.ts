export function isTokenExpired(token:string):boolean{
    const base64=token.split('.')[1]
    const tokenob=JSON.parse(atob(base64 as string))
    if(tokenob.exp*1000<Date.now()){
        return true
    }
    return false
}