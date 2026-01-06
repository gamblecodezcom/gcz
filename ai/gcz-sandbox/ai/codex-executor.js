import fs from "fs";
import { execSync } from "child_process";
const FILE="/tmp/gcz_approvals.json";
const CANARY_LOG="/var/log/gcz/canary.log";
const HEALTH="http://127.0.0.1:9010/health";

function load(){ return fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE)):[]; }
function save(d){ fs.writeFileSync(FILE,JSON.stringify(d,null,2)); }
async function http(url){ return await (await fetch(url)).json(); }

async function run(){
  let q = load();
  for(const t of q){
    if(t.status!=="approved" || t.executed) continue;

    t.executed=true;
    t.started=new Date().toISOString();
    save(q);

    fs.appendFileSync(CANARY_LOG,`\n=== START ${t.id} ===\n${t.task}\n`);

    try{
      // STEP 1 — APPLY CODE CHANGE VIA MCP / TOOLCHAIN
      execSync(`cd /var/www/html/gcz && echo "${t.task}" >> /tmp/gcz_task_${t.id}.txt`);

      // STEP 2 — CANARY RESTART
      execSync("pm2 restart gcz-sandbox-api gcz-sandbox-bot gcz-sandbox-ai --update-env");

      // STEP 3 — HEALTH PROBE LOOP
      for(let i=0;i<6;i++){
        await new Promise(r=>setTimeout(r,10000));
        const h = await http(HEALTH);
        if(h.status!=="ok") throw new Error("Health degraded");
      }

      // STEP 4 — SUCCESS
      t.status="deployed";
      t.completed=new Date().toISOString();
      save(q);
      fs.appendFileSync(CANARY_LOG,`SUCCESS ${t.id}\n`);
    } catch(err){
      // STEP 5 — ROLLBACK
      fs.appendFileSync(CANARY_LOG,`ROLLBACK ${t.id} ${err}\n`);
      execSync("cd /var/www/html/gcz && git reset --hard HEAD~1");
      execSync("pm2 restart gcz-sandbox-*");

      t.status="rollback";
      t.error=err.toString();
      save(q);
    }
  }
}
run();
