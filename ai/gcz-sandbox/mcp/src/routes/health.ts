import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function registerHealthRoutes(server: Server) {
  server.setRequestHandler<any,any>("gcz.health", async () => {
    return {
      content:[{type:"json",json:{ok:true,service:"gcz-mcp"}}]
    };
  });
}
