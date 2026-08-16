export function json<T>(payload: T, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(payload, { status, headers });
}

export function noContent(headers: HeadersInit = {}): Response {
  return new Response(null, { status: 204, headers });
}
