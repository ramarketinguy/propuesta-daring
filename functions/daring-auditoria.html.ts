export const onRequest: PagesFunction = async (): Promise<Response> => {
  return new Response(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Página no disponible | Daring</title><style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#0d080a;color:#fff;font-family:system-ui,sans-serif;text-align:center}a{color:#e58a95;font-weight:700}</style></head><body><main><h1>Esta página ya no existe.</h1><p>Visitá <a href="https://daring.com.uy/">daring.com.uy</a> para conocer la sartén Daring.</p></main></body></html>',
    {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      }
    }
  );
};
