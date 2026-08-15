export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  let database = "unavailable";

  try {
    await env.DB.prepare("SELECT 1").first();
    database = "ready";
  } catch {
    database = "error";
  }

  return Response.json({
    service: "daring-landing",
    database,
    environment: "production",
  });
};
