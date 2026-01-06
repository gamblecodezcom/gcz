import express from "express";
import crypto from "crypto";

const BOT = process.env.TELEGRAM_BOT_TOKEN_SANDBOX;
if(!BOT) throw new Error("TELEGRAM_BOT_TOKEN_SANDBOX missing");

const app = express();
app.use(express.json({ limit:"2mb" }));

// replay guard
const recent = new Set();
setInterval(()=>recent.clear(), 60000);

// health
app.get("/health", (req,res)=>res.json({status:"ok",service:"gcz-agent-webhook"}));

app.post("/webhook/gcz-agent", async (req,res)=>{
  try{
    const sig=req.headers["x-telegram-bot-api-secret-token"]||"";
    if(process.env.TG_SECRET && sig!==process.env.TG_SECRET) return res.sendStatus(403);

    const hash=crypto.createHash("sha256").update(JSON.stringify(req.body)).digest("hex");
    if(recent.has(hash)) return res.sendStatus(200);
    recent.add(hash);

    const update=req.body;

    // route callback approvals
    if(update.callback_query){
      const data=update.callback_query.data;
      const {handleCallback}=await import("../ai/approvals.js");
      await handleCallback(data);
    }

    res.sendStatus(200);
  }catch(e){
    console.error("WEBHOOK ERROR",e);
    res.sendStatus(500);
  }
});

app.listen(9099, ()=>console.log("GCZ agent webhook on 9099"));
