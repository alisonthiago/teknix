import { createAdminClient } from '@/utils/supabase/admin'
import type { FlowWebhookInput } from './types'

export async function receiveFlowWebhook(input: FlowWebhookInput) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('flow_webhook_events').upsert({
    channel_id: input.channelId ?? null,
    event_key: input.eventKey,
    topic: input.topic,
    resource: input.resource ?? null,
    payload: input.payload,
    status: 'RECEIVED',
  }, { onConflict: 'event_key', ignoreDuplicates: true }).select('id,event_key,status').maybeSingle()
  if (error) throw error
  return { duplicate: !data, event: data }
}