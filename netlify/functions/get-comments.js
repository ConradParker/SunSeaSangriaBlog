const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE_URL = process.env.SITE_URL;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": SITE_URL,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  const slug = (event.queryStringParameters || {}).slug;

  if (!slug) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Missing slug parameter." }),
    };
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, body, approved_at")
    .eq("post_slug", slug)
    .eq("status", "approved")
    .order("approved_at", { ascending: true });

  if (error) {
    console.error("Query failed:", error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Something went wrong." }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
};
