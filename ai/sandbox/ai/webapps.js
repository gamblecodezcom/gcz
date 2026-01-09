import fs from "fs";
import crypto from "crypto";

const FILE="/var/www/html/gcz/ai/sandbox/ai/webapps.json";
const HISTORY="/var/log/gcz/webapps-history.json";
const ALERT="/var/log/gcz/webapps-anomaly.log";

function sha(x){return crypto.createHash("sha256").update(x).digest("hex");}
function now(){return new Date().toISOString();}

function loadFile(){
  if(!fs.existsSync(FILE)) throw new Error("WebApps file missing");
  return fs.readFileSync(FILE,"utf8");
}

function persistHistory(e){
  let arr=[];
  if(fs.existsSync(HISTORY)) arr=JSON.parse(fs.readFileSync(HISTORY));
  arr.push(e);
  fs.writeFileSync(HISTORY,JSON.stringify(arr,null,2));
}

function logAnomaly(reason,meta){
  const line={ts:now(),reason,meta};
  fs.appendFileSync(ALERT,JSON.stringify(line)+"\n");
}

function validateSchema(obj){
  if(!Array.isArray(obj)) throw new Error("WebApps must be array");

  for(const w of obj){
    if(typeof w.name!=="string") throw new Error("Missing name");
    if(typeof w.url!=="string") throw new Error("Missing url");
    if(typeof w.id!=="number" && typeof w.id!=="string") throw new Error("Missing id");
  }
  return true;
}

function anomalyScore(oldHash,newHash,length){
  let score=0;
  if(oldHash!==newHash) score+=3;
  if(length===0) score+=5;
  if(length>500) score+=2;
  return score;
}

export function loadWebApps(){
  const raw=loadFile();
  const hash=sha(raw);
  const data=JSON.parse(raw);

  validateSchema(data);

  let prevHash=null;
  if(fs.existsSync(HISTORY)){
    const hist=JSON.parse(fs.readFileSync(HISTORY));
    const last=hist[hist.length-1];
    prevHash=last?.hash;
  }

  const score=anomalyScore(prevHash,hash,data.length);

  persistHistory({ts:now(),hash,count:data.length,score});

  if(score>=5){
    logAnomaly("HIGH RISK CONFIG CHANGE",{count:data.length,score});
  }

  return {apps:data,hash,score};
}
