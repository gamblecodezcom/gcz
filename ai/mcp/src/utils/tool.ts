export function toolResult(data: unknown) {
  return {
    content:[{type:"json",json:data}]
  };
}
