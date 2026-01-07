import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { pool } from "../services/db.js";

export function registerDbRoutes(server: Server) {

  server.setRequestHandler<any,any>("gcz.db.query", async (extra: any) => {
    const { sql, params } = (extra.params || {}) as any;

    const rows = (await pool.query(sql, params || [])).rows;

    return {
      content:[{type:"json",json:{rows}}]
    };
  });

}
