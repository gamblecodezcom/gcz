import type { GczMcp } from "../utils/mcp";
import { emitLog } from "../services/telemetry.js";

let history:any[]=[];

export function registerNarrative(server: GczMcp){

  server.setRequestHandler<any,any>("gcz.ai.narrative.event", async (extra: any)=>{
    const ev = (extra.params||{}) as any;
    history.push({...ev,ts:Date.now()});
    if(history.length>500) history.shift();
    emitLog(`Narrative event: ${ev.type||"unknown"}`);
    return {content:[{type:"json",json:{ok:true}}]};
  });

  server.setRequestHandler<any,any>("gcz.ai.narrative.summary", async ()=>{
    const items = history.slice(-40);
    return {content:[{type:"json",json:{items}}]};
  });

  server.setRequestHandler<any,any>("gcz.ai.convo.memory", async (extra: any)=>{
    const ev = (extra.params||{}) as any;
    history.push({type:"conversation",role:ev.role,text:ev.text,ts:Date.now()});
    emitLog(`Convo memory ${ev.role}: ${ev.text.slice(0,80)}`);
    return {content:[{type:"json",json:{stored:true}}]};
  });

  server.setRequestHandler<any,any>("gcz.ai.autodev.loop", async (extra: any)=>{
    emitLog("Autonomous Dev Loop Triggered");
    return {content:[{type:"json",json:{running:true}}]};
  });

}
