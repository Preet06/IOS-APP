// Follows Deno/Supabase Edge Function conventions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validate authorization header if secret is configured
  if (REVENUECAT_WEBHOOK_SECRET) {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const payload = await req.json();
    const event = payload.event;

    if (!event) {
      return new Response(JSON.stringify({ error: 'Missing event payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { type, app_user_id, period_type } = event;
    if (!app_user_id) {
      return new Response(JSON.stringify({ message: 'Ignored: No app_user_id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine target subscription_status enum value
    let targetStatus: 'free' | 'trial' | 'active' | 'expired' | 'canceled' = 'free';

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION':
        targetStatus = period_type === 'TRIAL' ? 'trial' : 'active';
        break;
      case 'CANCELLATION':
        targetStatus = 'canceled';
        break;
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        targetStatus = 'expired';
        break;
      default:
        // Ignore unhandled event types (e.g. TEST, SUBSCRIBER_ALIAS)
        return new Response(JSON.stringify({ message: `Ignored event type: ${type}` }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: targetStatus })
      .eq('id', app_user_id);

    if (error) {
      console.error(`[Webhook] Failed to update profile ${app_user_id}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Webhook] Updated ${app_user_id} subscription_status to "${targetStatus}"`);
    return new Response(
      JSON.stringify({ success: true, user_id: app_user_id, status: targetStatus }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Webhook] Unhandled error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

