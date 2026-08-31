export const onRequestGet: PagesFunction = async () => {
  return new Response('google-site-verification: google4a7ae9e6139d186e.html', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
