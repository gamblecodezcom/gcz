import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { reviewCode } from "../services/codereview.js";

export function registerCodeReview(server: Server) {

  server.setRequestHandler<any,any>("gcz.codereview.scan", async (extra: any) => {

    const diff = String((extra.params || {}).diff || "");

    const findings = await reviewCode(diff);

    return {
      content: [
        {
          type: "json",
          json: { findings }
        }
      ]
    };
  });

}
