export const onRequest: PagesFunction = async () => {
  return new Response("google-site-verification: google83c5729b27d1923d.html\n", {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
