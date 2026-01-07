import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const memory: Record<string,string[]> = {};

export function registerGczTools(server: Server) {

  server.setRequestHandler<any,any>("gcz.ai.memory.write", async (extra: any) => {
    const { category, message } = (extra.params || {}) as any;

    if (!memory[category]) memory[category] = [];
    memory[category].push(message);

    return {
      content:[{type:"json",json:{stored:true,count:memory[category].length}}]
    };
  });

  server.setRequestHandler<any,any>("gcz.ai.memory.read", async (extra: any) => {
    const { category } = (extra.params || {}) as any;

    return {
      content:[{type:"json",json:{items:memory[category] || []}}]
    };
  });
}
