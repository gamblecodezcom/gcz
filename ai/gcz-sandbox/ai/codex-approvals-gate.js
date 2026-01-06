import express from "express";
import fs from "fs";
import fetch from "node-fetch";
import crypto from "crypto";

const FILE="/tmp/gcz_ci_queue.json";
const BOT=process.env.TELEGRAM_BOT_TOKEN_SANDBOX;
const ADMIN="6668510825";
const API=`https://api.telegram.org/bot${BOT}`;
const PORT=9099;
const APPROVAL_LOG="/var/log/gcz/ci-approvals.log";
import { makeDiff, hash } from "./diff.js";

// helpers
function load(){return fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE)):{queue:[]};}
function save(x){fs.writeFileSync(FILE,JSON.stringify(x,null,2));}
function log(x){fs.appendFileSync(APPROVAL_LOG,JSON.stringify({ts:new Date().toISOString(),...x})+"\n");}
function hash(v){return crypto.createHash("sha256").update(v).digest("hex");}

async function telegram(msg){
  await fetch(`${API}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:ADMIN,text:msg,parse_mode:"Markdown"})});
}

async function notifyGate(task){
  const kb={inline_keyboard:[
    [{text:"✅ APPROVE",callback_data:`approve_${task.id}`}],
    [{text:"❌ DENY",callback_data:`deny_${task.id}`}],
    [{text:"🔁 ROLLBACK",callback_data:`rollback_${task.id}`}]
  ]};
  await fetch(`${API}/sendMessage`,{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({
      chat_id:ADMIN,
      text:`⚠️ *GCZ-CI REQUEST*\n\nID: *${task.id}*\nType: *${task.type}*\nHash: \`${task.hash}\`\n\nApprove deployment?`,
      parse_mode:"Markdown",
      reply_markup:kb
    })
  });
}

export async function queueChange(type,payload){
  let db=load();
  const id=db.queue.length+1;
  const item={id,type,payload,hash:hash(JSON.stringify(payload)),status:"pending"};
  db.queue.push(item);
  save(db);
  await notifyGate(item);
  return item;
}

export async function handleCallback(cb){
  let db=load();
  const [action,id]=cb.data.split("_");
  const item=db.queue.find(x=>x.id==id);
  if(!item) return;

  item.status=action;
  item.updated=new Date().toISOString();
  save(db);

  if(action==="approve"){
    log({event:"approved",id});
    await telegram(`✅ Approved change ID ${id}`);
  }
  if(action==="deny"){
    log({event:"denied",id});
    await telegram(`❌ Denied change ID ${id}`);
  }
  if(action==="rollback"){
    log({event:"rollback_requested",id});
    await telegram(`🔁 Rollback requested ID ${id}`);
  }
}

// --- TELEGRAM CALLBACK ROUTER ---
const app=express();
app.use(express.json());

app.post("/telegram",async(req,res)=>{
  try{
    if(req.body?.callback_query){
      await handleCallback(req.body.callback_query);
    }
    res.json({ok:true});
  }catch(e){
    res.json({ok:false,error:e.message});
  }
});

app.listen(PORT,()=>console.log("CI Gate Telegram Handler on",PORT));

// ===== CANARY FREEZE BYPASS =====
let CANARY_BYPASS=false;
let CANARY_EXPIRES=null;

export function canaryBypassAllowed(){
  if(!CANARY_BYPASS) return false;
  if(CANARY_EXPIRES && Date.now()>CANARY_EXPIRES){
    CANARY_BYPASS=false;
    CANARY_EXPIRES=null;
    return false;
  }
  return true;
}

export function enableCanaryBypass(){
  CANARY_BYPASS=true;
  CANARY_EXPIRES=Date.now()+1000*60*30; // 30m
  return CANARY_EXPIRES;
}

export function disableCanaryBypass(){
  CANARY_BYPASS=false;
  CANARY_EXPIRES=null;
}

// ===== CANARY MODE =====
let CANARY_MODE=true;

export function isCanary(){
  return CANARY_MODE===true;
}

export function labelDeployment(task){
  task.canary = isCanary();
  return task;
}
export async function explain_diff(sql,conn){return explainDiff(sql,conn)}
setInterval(()=>{const fs=require("fs");if(fs.existsSync("/tmp/gcz_panic.flag")){const t=parseInt(fs.readFileSync("/tmp/gcz_panic.flag"));if(Date.now()-t>1800000)fs.unlinkSync("/tmp/gcz_panic.flag");}},60000);// self-heal watchdog
