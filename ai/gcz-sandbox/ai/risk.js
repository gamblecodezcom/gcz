export function risk(sql){
  let s = 0;
  if(/drop|truncate/i.test(sql)) s+=80;
  if(/delete/i.test(sql)) s+=40;
  if(/update/i.test(sql)) s+=25;
  if(/alter|create/i.test(sql)) s+=50;
  if(/where\s+id\s*=/i.test(sql)) s-=10;
  return Math.max(0,s);
}
