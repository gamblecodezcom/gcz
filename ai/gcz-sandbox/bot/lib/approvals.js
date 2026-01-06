import fs from "fs";
const FILE="/tmp/gcz_approvals.json";

function load(){
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
}
function save(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

export function queue(task){ const a=load(); a.push(task); save(a); }
export function list(){ return load(); }
export function approve(id){ let a=load(); let t=a.find(x=>x.id==id); if(!t) return null; t.status="approved"; save(a); return t; }
export function deny(id){ let a=load(); let t=a.find(x=>x.id==id); if(!t) return null; t.status="denied"; save(a); return t; }
export function rollbackMark(id){ let a=load(); let t=a.find(x=>x.id==id); if(!t) return null; t.status="rollback"; save(a); return t; }
