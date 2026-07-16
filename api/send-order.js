// Vercel serverless function (Node.js runtime)
// Receives the order from script.js and emails the full customer
// details to YOU via Resend (https://resend.com).
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   - your Resend API key
//   TO_EMAIL          - the email address that should receive new orders (your inbox)
//   FROM_EMAIL        - a sender address verified in Resend, e.g. "orders@yourdomain.com"
//                        (Resend also gives you a free onboarding@resend.dev sender for testing)

const { Resend } = require("resend");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const {
  name, phone, address, landmark, city, state, pincode,
  payment, product, amount, orderId, deliveryDate,
} = req.body || {};

    if (!name || !phone || !address || !city || !state || !pincode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.TO_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    if (!resendApiKey || !toEmail) {
      console.error("Missing RESEND_API_KEY or TO_EMAIL environment variable");
      res.status(500).json({ error: "Email service not configured" });
      return;
    }

    const resend = new Resend(resendApiKey);

    const html = `
      <h2>New order received — ${orderId || ""}</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td><strong>Product</strong></td><td>${escapeHtml(product || "")}</td></tr>
        <tr><td><strong>Amount</strong></td><td>₹${escapeHtml(String(amount ?? ""))}</td></tr>
        <tr><td><strong>Payment method</strong></td><td>${escapeHtml(payment || "")}</td></tr>
        <tr><td><strong>Estimated delivery</strong></td><td>${escapeHtml(deliveryDate || "")}</td></tr>
        <tr><td colspan="2"><hr/></td></tr>
        <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>
        <tr><td><strong>Address</strong></td><td>${escapeHtml(address)}</td></tr>
        <tr><td><strong>Landmark</strong></td><td>${escapeHtml(landmark || "-")}</td></tr>
        <tr><td><strong>City</strong></td><td>${escapeHtml(city)}</td></tr>
        <tr><td><strong>State</strong></td><td>${escapeHtml(state)}</td></tr>
        <tr><td><strong>Pincode</strong></td><td>${escapeHtml(pincode)}</td></tr>
      </table>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New order ${orderId || ""} — ${product || "CleanGlide Mop"}`,
      html,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-order error:", err);
    res.status(500).json({ error: "Failed to send order" });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}