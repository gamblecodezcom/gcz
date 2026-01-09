import fs from "fs";
import crypto from "crypto";

const FILE="/var/www/html/gcz/ai/sandbox/ai/webapps.json";
const FREEZE="/var/www/html/gcz/ai/sandbox/ai/webapps.lock";
const ALERT="/var/log/gcz/webapps-anomaly.log";

function sha(v){return crypto.createHash("sha256").update(v).digest("hex");}
function now(){return new Date().toISOString();}

function log(ev){
  fs.appendFileSync(ALERT,JSON.stringify({ts:now(),...ev})+"\n");
}

function loadRaw(){
  if(!fs.existsSync(FILE)) throw new Error("WebApps registry missing");
  return fs.readFileSync(FILE,"utf8");
}

function validate(obj){
  if(!Array.isArray(obj)) throw new Error("WebApps must be array");
  for(const w of obj){
    if(typeof w.name!=="string") throw new Error("Missing name");
    if(typeof w.url!=="string") throw new Error("Missing url");
  }
}

export function loadFrozenWebApps(){
  const raw=loadRaw();
  const hash=sha(raw);
  const data=JSON.parse(raw);
  validate(data);

  // first-time freeze
  if(!fs.existsSync(FREEZE)){
    fs.writeFileSync(FREEZE,hash);
    return {apps:data,hash,frozen:true};
  }

  const frozen=fs.readFileSync(FREEZE,"utf8").trim();

  if(frozen!==hash){
    log({event:"FREEZE_VIOLATION",expected:frozen,actual:hash,count:data.length});
    throw new Error("CONFIG FREEZE VIOLATION — HUMAN APPROVAL REQUIRED");
  }

  return {apps:data,hash,frozen:true};
}
