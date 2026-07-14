import { EmailMessage } from "cloudflare:email";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const name    = formData.get("name")    || "";
      const email   = formData.get("email")   || "";
      const phone   = formData.get("phone")   || "Not provided";
      const message = formData.get("message") || "";

      const body = `New contact form submission from SnoSite\r\n\r\nName: ${name}\r\nEmail: ${email}\r\nPhone: ${phone}\r\nMessage: ${message}`;

      const raw =
        `From: contact-snosite@snosite.com\r\n` +
        `To: snositewebdesign@gmail.com\r\n` +
        `Subject: New message from ${name}\r\n` +
        `Content-Type: text/plain\r\n` +
        `\r\n` +
        body;

      const msg = new EmailMessage(
        "contact-snosite@snosite.com",
        "snositewebdesign@gmail.com",
        raw
      );

      await env.EMAIL.send(msg);

      const referer = request.headers.get("Referer") || "https://snosite.com";
      const redirectUrl = new URL(referer);
      redirectUrl.searchParams.set("sent", "1");
      return Response.redirect(redirectUrl.toString(), 303);

    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  },
};
