import crypto from "crypto";

export function makeDiff(before,after){
  const b=(before||"").split("\n");
  const a=(after||"").split("\n");
  let out=[];
  const max=Math.max(a.length,b.length);

  for(let i=0;i<max;i++){
    if(a[i]===b[i]) out.push(`  ${a[i]??""}`);
    else{
      if(b[i]!==undefined) out.push(`- ${b[i]}`);
      if(a[i]!==undefined) out.push(`+ ${a[i]}`);
    }
  }
  return out.join("\n");
}

export function hash(v){
  return crypto.createHash("sha256").update(v).digest("hex");
}
