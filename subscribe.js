import { randomUUID } from "node:crypto";

const PLANS = {
  pro: { amount: 199, reason: "La Verdad Incómoda PRO", slug: "pro" },
  profesional: { amount: 699, reason: "La Verdad Incómoda Profesional", slug: "profesional" }
};

function json(status, body) {
  return { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: "La pasarela de pago aún no está activada. Falta configurar MERCADOPAGO_ACCESS_TOKEN en Vercel." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const plan = PLANS[String(body.plan || "").toLowerCase()];
    const email = String(body.email || "").trim().toLowerCase();

    if (!plan) return res.status(400).json({ error: "Plan no válido" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Correo electrónico no válido" });

    const reference = `LVI-${plan.slug.toUpperCase()}-${randomUUID()}`;
    const base = process.env.PUBLIC_BASE_URL || "https://www.laverdadincomoda.mx";

    const mp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason: plan.reason,
        external_reference: reference,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: plan.amount,
          currency_id: "MXN"
        },
        back_url: `${base}/pago-exitoso.html?plan=${plan.slug}`,
        status: "pending"
      })
    });

    const data = await mp.json();
    if (!mp.ok || !data.init_point) {
      console.error("Mercado Pago subscription error", data);
      return res.status(502).json({ error: "No fue posible crear la suscripción", detail: data.message || data.error || "Mercado Pago no devolvió un checkout." });
    }

    return res.status(200).json({
      checkout_url: data.init_point,
      subscription_id: data.id,
      plan: plan.slug,
      reference
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno al preparar el pago" });
  }
}
