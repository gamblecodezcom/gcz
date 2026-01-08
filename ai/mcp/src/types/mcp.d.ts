import "@modelcontextprotocol/sdk/server/index.js";

declare module "@modelcontextprotocol/sdk/server/index.js" {
  interface Server<RequestT = any, NotificationT = any, ResultT = any> {
    setRequestHandler<TParams = any, TResult = any>(
      method: string,
      handler: (request: { params?: TParams }) => TResult | Promise<TResult>
    ): void;
    connectStdio(): Promise<void>;
  }
}
