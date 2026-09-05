export const onRequest: PagesFunction = async () => {
  return new Response('4vdlgdcwfu1qa27cfbuchjiy93u42r', {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
