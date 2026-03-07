const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function htmlPage(title, message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
  <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); max-width: 500px; text-align: center;">
    <p style="font-size: 18px; line-height: 1.6; color: #333;">${message}</p>
  </div>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const params = event.queryStringParameters || {};
  const { id, token, action } = params;

  if (!id || !token || !["approve", "reject"].includes(action)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html" },
      body: htmlPage("Invalid Request", "Invalid moderation link."),
    };
  }

  // Fetch the comment
  const { data: comment, error } = await supabase
    .from("comments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !comment) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: htmlPage("Not Found", "Comment not found."),
    };
  }

  // Already moderated?
  if (comment.status === "approved" || comment.status === "rejected") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: htmlPage(
        "Already Moderated",
        "This comment has already been moderated."
      ),
    };
  }

  // Verify token with timing-safe comparison
  const tokenBuffer = Buffer.from(token, "utf8");
  const storedBuffer = Buffer.from(comment.moderation_token, "utf8");

  if (
    tokenBuffer.length !== storedBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, storedBuffer)
  ) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "text/html" },
      body: htmlPage("Forbidden", "Invalid moderation link."),
    };
  }

  // Apply moderation action
  const updates =
    action === "approve"
      ? { status: "approved", approved_at: new Date().toISOString() }
      : { status: "rejected" };

  const { error: updateError } = await supabase
    .from("comments")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    console.error("Update failed:", updateError);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html" },
      body: htmlPage("Error", "Something went wrong. Please try again."),
    };
  }

  const message =
    action === "approve"
      ? `&#10003; Comment by ${comment.author_name} has been approved.`
      : `&#128465; Comment by ${comment.author_name} has been rejected.`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: htmlPage(
      action === "approve" ? "Approved" : "Rejected",
      message
    ),
  };
};
