const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = process.env.SITE_URL;
const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL;

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": SITE_URL,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { post_slug, author_name, author_email, body, honeypot } = JSON.parse(
      event.body
    );

    // Honeypot: silently succeed but don't save
    if (honeypot) {
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ success: true }),
      };
    }

    // Validate required fields
    if (!post_slug || !author_name || !author_email || !body) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "All fields are required." }),
      };
    }

    if (!isValidEmail(author_email)) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "Please enter a valid email address." }),
      };
    }

    const trimmedName = author_name.trim().slice(0, 100);
    const sanitisedBody = stripHtml(body.trim()).slice(0, 2000);

    if (!trimmedName || !sanitisedBody) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "Name and comment cannot be empty." }),
      };
    }

    // Rate limit: max 3 submissions per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_email", author_email.trim().toLowerCase())
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check failed:", countError);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "Something went wrong." }),
      };
    }

    if (count >= 3) {
      return {
        statusCode: 429,
        headers: corsHeaders(),
        body: JSON.stringify({
          message: "Too many comments. Please try again later.",
        }),
      };
    }

    // Generate moderation token and insert comment
    const moderation_token = crypto.randomBytes(32).toString("hex");

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_slug: post_slug.trim(),
        author_name: trimmedName,
        author_email: author_email.trim().toLowerCase(),
        body: sanitisedBody,
        status: "pending",
        moderation_token,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert failed:", insertError);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "Something went wrong." }),
      };
    }

    // Send moderation email
    const approveUrl = `${SITE_URL}/.netlify/functions/moderate-comment?id=${data.id}&token=${moderation_token}&action=approve`;
    const rejectUrl = `${SITE_URL}/.netlify/functions/moderate-comment?id=${data.id}&token=${moderation_token}&action=reject`;
    const submittedAt = new Date(data.created_at).toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    });

    await resend.emails.send({
      from: `noreply@${new URL(SITE_URL).hostname}`,
      to: MODERATOR_EMAIL,
      subject: `New comment pending approval on "${data.post_slug}"`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px; color: #333;">A new comment is waiting for your review.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 12px; font-weight: 600; color: #555;">Post</td><td style="padding: 6px 12px;">${data.post_slug}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: 600; color: #555;">Author</td><td style="padding: 6px 12px;">${trimmedName} (${author_email.trim()})</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: 600; color: #555;">Submitted</td><td style="padding: 6px 12px;">${submittedAt}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
          <div style="background: #f8f8f8; padding: 16px; border-radius: 6px; font-size: 15px; line-height: 1.6; color: #333; white-space: pre-wrap;">${sanitisedBody}</div>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
          <div style="text-align: center; margin: 24px 0;">
            <a href="${approveUrl}" style="display: inline-block; padding: 14px 32px; background-color: #27ae60; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; margin-right: 12px;">Approve Comment</a>
            <a href="${rejectUrl}" style="display: inline-block; padding: 14px 32px; background-color: #c0392b; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Reject Comment</a>
          </div>
          <p style="font-size: 13px; color: #999; text-align: center;">These links can only be used once.</p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Something went wrong." }),
    };
  }
};
