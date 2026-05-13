import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

type Body = {
  invoiceId?: string;
  amount?: number;
  customerEmail?: string | null;
};

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json(
      { error: "Server configuration error: STRIPE_SECRET_KEY is not set." },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server configuration error: Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const accessToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Missing or invalid authorization." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId.trim() : "";
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, user_id, total, status, customer_email")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (invoice.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const status = String(invoice.status ?? "").toLowerCase();
  if (status === "paid") {
    return NextResponse.json({ error: "Invoice is already paid." }, { status: 400 });
  }

  const totalFromDb = Number(invoice.total);
  if (!Number.isFinite(totalFromDb) || totalFromDb <= 0) {
    return NextResponse.json({ error: "Invoice has an invalid total." }, { status: 400 });
  }

  const clientAmount = body.amount != null ? Number(body.amount) : null;
  if (
    clientAmount != null &&
    Number.isFinite(clientAmount) &&
    Math.abs(clientAmount - totalFromDb) > 0.01
  ) {
    return NextResponse.json({ error: "Amount does not match invoice total." }, { status: 400 });
  }

  const unitAmountCents = Math.round(totalFromDb * 100);
  if (unitAmountCents < 50) {
    return NextResponse.json(
      { error: "Amount is too small for Stripe (minimum 50 cents CAD)." },
      { status: 400 }
    );
  }

  const emailFromBody =
    typeof body.customerEmail === "string" && body.customerEmail.trim() !== ""
      ? body.customerEmail.trim()
      : null;
  const customerEmail =
    emailFromBody ?? (invoice.customer_email ? String(invoice.customer_email).trim() : null);

  const stripe = new Stripe(stripeSecret);

  try {
    const price = await stripe.prices.create({
      currency: "cad",
      unit_amount: unitAmountCents,
      product_data: {
        name: `TradeDesk invoice ${invoiceId.slice(0, 8)}`,
        metadata: { invoice_id: invoiceId },
      },
    });

    const paymentLinkParams: Stripe.PaymentLinkCreateParams = {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        invoice_id: invoiceId,
        user_id: user.id,
      },
    };

    if (customerEmail) {
      paymentLinkParams.payment_intent_data = {
        metadata: { customer_email: customerEmail },
      };
    }

    const paymentLink = await stripe.paymentLinks.create(paymentLinkParams);

    return NextResponse.json({ url: paymentLink.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
