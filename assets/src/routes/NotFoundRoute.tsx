export function notFoundLoader(): never {
  throw new Response("Not found", {
    status: 404,
    statusText: "Not Found"
  });
}
