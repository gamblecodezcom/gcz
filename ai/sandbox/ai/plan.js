import { execSync } from "child_process";
import { makeDiff } from "./diff.js";

export function explainDiff(sql,conn){
  function plan(q){
    return execSync(`psql ${conn} -c "EXPLAIN ${q}" -At`,{encoding:"utf8"});
  }
  return makeDiff(plan(sql.before),plan(sql.after));
}
