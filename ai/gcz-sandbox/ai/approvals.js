import fetch from "node-fetch";
import fs from "fs";

const FILE="/tmp/gcz_approvals.json";
const BOT=process.env.TELEGRAM_BOT_TOKEN_SANDBOX;
const ADMIN="6668510825";
const API=`https://api.telegram.org/bot${BOT}`;

function load(){ return fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE)):[]; }
function save(d){ fs.writeFileSync(FILE,JSON.stringify(d,null,2)); }

export async function notify(task,score){
  let q=load();
  const id=q.length+1;
  q.push({id,task,score,expires:Date.now()+1800000,status:"pending",created:new Date().toISOString()});
  save(q);

  const text=`⚠️ *GCZ-AI CHANGE REQUEST*\n\nID: *${id}*\nRisk: *${score}*\n\nApprove deployment?`;
  const kb={
    inline_keyboard:[
      [{text:"✅ APPROVE",callback_data:`approve_${id}`}],
      [{text:"❌ DENY",callback_data:`deny_${id}`}],
      [{text:"🔁 ROLLBACK",callback_data:`rollback_${id}`}]
    ]
  };

  await fetch(`${API}/sendMessage`,{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({chat_id:ADMIN,text,parse_mode:"Markdown",reply_markup:kb})
  });
}

export async function handleCallback(data){
  let q=load();
  const [action,id]=data.split("_");
  const task=q.find(t=>t.id==id);
  if(!task) return;

  if(action==="approve") task.status="approved";
  if(action==="deny") task.status="denied";
  if(action==="rollback") task.status="rollback_requested";

  task.updated=new Date().toISOString();
  save(q);
}

export async function handleAdminCommand(text){
  if(text==="/canary_bypass enable"){
    const t=enableCanaryBypass();
    await telegram("🟡 Canary freeze bypass ENABLED for 30m");
  }
  if(text==="/canary_bypass disable"){
    disableCanaryBypass();
    await telegram("🔒 Canary freeze bypass DISABLED");
  }
}
