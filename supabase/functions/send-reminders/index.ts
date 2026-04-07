// Supabase Edge Function: send-reminders
// Runs daily via pg_cron. Finds events happening in 2 days,
// emails everyone who voted 'in' with a link to change their vote.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://flakeapp.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (_req) => {
  try {
    // Find events happening exactly 2 days from today that haven't been reminded yet
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + 2)
    const dateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, date, token')
      .eq('date', dateStr)
      .eq('reminder_sent', false)

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 })
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'no events to remind', date: dateStr }), { status: 200 })
    }

    const results = []

    for (const event of events) {
      // Get all participants who voted 'in' and have an email
      const { data: participants, error: pError } = await supabase
        .from('participants')
        .select('name, email')
        .eq('event_id', event.id)
        .eq('vote', 'in')
        .eq('is_organizer', false)
        .not('email', 'is', null)

      if (pError) {
        console.error(`Error fetching participants for event ${event.id}:`, pError)
        results.push({ event: event.name, error: pError.message })
        continue
      }

      const voteLink = `${APP_URL}/vote/${event.token}`
      let emailsSent = 0

      for (const participant of participants ?? []) {
        if (!participant.email) continue

        const emailBody = `Still on for ${event.name} on ${formatDate(event.date)}? If you want to back out and rot on your couch, now is the time. Click here to vote: ${voteLink}`

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'flake <reminders@flakeapp.pro>',
            to: participant.email,
            subject: `still down for ${event.name}?`,
            text: emailBody,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #111; color: #fff; padding: 2rem; border-radius: 12px;">
                <h1 style="color: #88EAF6; font-size: 1.5rem; margin-bottom: 0.5rem;">still down for ${event.name}?</h1>
                <p style="color: #999; font-size: 0.85rem; margin-bottom: 1.5rem;">${formatDate(event.date)}</p>
                <p style="line-height: 1.7; color: #ccc;">
                  Still on for <strong>${event.name}</strong> on <strong>${formatDate(event.date)}</strong>?
                  If you want to back out and rot on your couch, now is the time.
                </p>
                <a href="${voteLink}" style="display: inline-block; margin-top: 1.5rem; background: #88EAF6; color: #111; padding: 0.9rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem;">
                  change my vote
                </a>
                <p style="color: #333; font-size: 0.75rem; margin-top: 2rem;">
                  you got this because you voted in for ${event.name}. click the link above to change your vote anonymously.
                </p>
              </div>
            `,
          }),
        })

        if (res.ok) {
          emailsSent++
        } else {
          const errText = await res.text()
          console.error(`Failed to send email to ${participant.email}:`, errText)
        }
      }

      // Mark event as reminder_sent = true
      await supabase
        .from('events')
        .update({ reminder_sent: true })
        .eq('id', event.id)

      results.push({ event: event.name, emailsSent, totalEligible: participants?.length ?? 0 })
    }

    return new Response(JSON.stringify({ success: true, results, date: dateStr }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
