export const ok = (data: unknown) => ({content:[{type:"json",json:data}]});
export const fail = (e: any) => ({
  content:[{type:"json",json:{error:true,message:String(e?.message||e)}}]
});
export const log = (...a: any[]) => console.log("[GCZ]",...a);
