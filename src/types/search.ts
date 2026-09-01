export interface searchrecordres{
status:number,
msg:string,
data:{list:string[]}
}

export interface addrecord{
    status:number,
    msg:string
}

export interface deleterecord{
    status:number,
    msg:string
}

export interface searchhotres{
    status:number,
    msg:string,
    data:{
        list:searchhotlist[]
    }
}

export interface searchhotlist{
    keyword:string,
    count:number
}

