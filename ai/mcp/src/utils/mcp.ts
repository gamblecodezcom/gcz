import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export type GczMcp = McpServer & {
  setRequestHandler: <TParams = any, TResult = any>(
    method: string,
    handler: (request: { params?: TParams }, extra?: any) => TResult | Promise<TResult>
  ) => void;
};

export function createGczMcpServer(info: {
  name: string;
  version: string;
  description?: string;
}): GczMcp {
  const mcp = new McpServer(info);
  const wrapper = mcp as GczMcp;

  wrapper.setRequestHandler = (method, handler) => {
    const schema: any = z.object({
      method: z.literal(method),
      params: z.any().optional()
    });

    return mcp.server.setRequestHandler(
      schema,
      ((request: any, extra: any) => handler(request as { params?: any }, extra)) as any
    );
  };

  return wrapper;
}

export async function connectStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export function toolResult(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload)
      }
    ],
    structuredContent: payload
  };
}
