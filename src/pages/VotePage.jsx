import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function VotePage() {
  const { token } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voted, setVoted] = useState(null) // 'in' | 'out'
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEvent()
  }, [token])

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setEvent(data)
    }
    setLoading(false)
  }

  async function handleVote(voteValue) {
    if (!name.trim()) {
      setError('drop your name first')
      return
    }
    setSubmitting(true)
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()

    // If they provided an email, check if they already voted (upsert by email+event)
    if (trimmedEmail) {
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', event.id)
        .eq('email', trimmedEmail)
        .maybeSingle()

      if (existing) {
        // Update their existing vote
        const { error: updateError } = await supabase
          .from('participants')
          .update({ vote: voteValue, name: name.trim() })
          .eq('id', existing.id)

        if (updateError) {
          setError('something went wrong. try again?')
          setSubmitting(false)
          return
        }
        setVoted(voteValue)
        setSubmitting(false)
        return
      }
    }

    // No email or no existing record — insert fresh
    const { error: voteError } = await supabase.from('participants').insert({
      event_id: event.id,
      name: name.trim(),
      email: trimmedEmail || null,
      vote: voteValue,
      is_organizer: false,
      user_id: null,
    })

    if (voteError) {
      setError('something went wrong. try again?')
      setSubmitting(false)
      return
    }

    setVoted(voteValue)
    setSubmitting(false)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('T')[0].split('-')
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) return <div className="loading">loading...</div>

  if (notFound) {
    return (
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: 'var(--blue)', marginBottom: '0.75rem', fontSize: '1.75rem' }}>
          event not found
        </h1>
        <p style={{ color: '#555', fontFamily: 'Poppins', fontSize: '0.95rem' }}>
          this link might be invalid or expired. ask whoever sent it to try again.
        </p>
      </div>
    )
  }

  // --- Post-vote confirmation ---
  if (voted) {
    return (
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {voted === 'in' ? '🎉' : '🛋️'}
        </div>
        <h1 style={{ color: 'var(--blue)', fontSize: '2rem', marginBottom: '0.75rem' }}>
          {voted === 'in' ? "you're in!" : 'vote logged.'}
        </h1>
        <p
          style={{
            color: '#666',
            fontFamily: 'Poppins',
            lineHeight: 1.7,
            fontSize: '0.95rem',
          }}
        >
          {voted === 'in'
            ? `see you at ${event.name}. please don't flake.`
            : `your vote to cancel is in. fingers crossed your friends are couch-people too.`}
        </p>
        {email.trim() && voted === 'in' && (
          <p style={{ color: '#444', fontFamily: 'Poppins', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            we'll nudge you a couple days before in case you change your mind. 😈
          </p>
        )}
      </div>
    )
  }

  // --- Voting form ---
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1
        style={{
          fontSize: '2.5rem',
          color: 'var(--blue)',
          marginBottom: '0.2rem',
          letterSpacing: '-0.02em',
        }}
      >
        flake
      </h1>
      <p
        style={{
          color: '#444',
          fontFamily: 'Poppins',
          fontSize: '0.8rem',
          marginBottom: '2.5rem',
        }}
      >
        for people who RSVP yes, but really mean no.
      </p>

      {/* Event info card */}
      <div
        style={{
          background: '#161616',
          border: '1px solid #242424',
          borderRadius: '10px',
          padding: '1.4rem 1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{event.name}</h2>
        <p style={{ color: '#666', fontFamily: 'Poppins', fontSize: '0.875rem' }}>
          {formatDate(event.date)}
        </p>
      </div>

      <p
        style={{
          fontFamily: 'Nunito',
          fontWeight: 900,
          fontSize: '1.15rem',
          marginBottom: '1.25rem',
          color: '#ccc',
        }}
      >
        are you in or are you trying to bail?
      </p>

      {/* Name input */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            fontFamily: 'Poppins',
            fontSize: '0.8rem',
            color: '#666',
            marginBottom: '0.4rem',
          }}
        >
          your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="what do people call you?"
          style={{
            width: '100%',
            background: '#161616',
            border: '1px solid #242424',
            borderRadius: '8px',
            padding: '0.8rem 1rem',
            color: 'var(--white)',
            fontFamily: 'Poppins',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Email input (optional) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontFamily: 'Poppins',
            fontSize: '0.8rem',
            color: '#666',
            marginBottom: '0.4rem',
          }}
        >
          your email{' '}
          <span style={{ color: '#3a3a3a', fontSize: '0.75rem' }}>(optional — we'll remind you before the event)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: '100%',
            background: '#161616',
            border: '1px solid #242424',
            borderRadius: '8px',
            padding: '0.8rem 1rem',
            color: 'var(--white)',
            fontFamily: 'Poppins',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <p
          style={{
            color: '#ff6b6b',
            fontFamily: 'Poppins',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </p>
      )}

      {/* Vote buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          onClick={() => handleVote('in')}
          disabled={submitting}
          style={{
            background: 'var(--blue)',
            color: 'var(--black)',
            border: 'none',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'Nunito',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.65 : 1,
          }}
        >
          ✅ yes, i'll be there
        </button>

        <button
          onClick={() => handleVote('out')}
          disabled={submitting}
          style={{
            background: '#161616',
            color: '#aaa',
            border: '1px solid #2e2e2e',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'Nunito',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.65 : 1,
          }}
        >
          🛋️ nah, i want to cancel
        </button>
      </div>
    </div>
  )
}
