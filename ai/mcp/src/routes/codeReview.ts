import type { GczMcp } from "../utils/mcp";
import { reviewCode } from "../services/codereview.js";

export function registerCodeReview(server: GczMcp) {

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