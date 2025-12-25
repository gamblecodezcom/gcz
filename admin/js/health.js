
fetch("/system/status")
  .then(r=>r.json())
  .then(j=>{
    document.getElementById("out").textContent = JSON.stringify(j,null,2);
  })
  .catch(e=>{
    document.getElementById("out").textContent = e.toString();
  });
