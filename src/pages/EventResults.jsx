import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EventResults() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', id)

    setEvent(eventData)
    setParticipants(participantsData || [])
    setLoading(false)
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

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/vote/${event.token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="loading">tallying votes...</div>

  if (!event) {
    return (
      <div
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#555', fontFamily: 'Poppins' }}>event not found.</p>
      </div>
    )
  }

  const voters = participants.filter((p) => !p.is_organizer && p.vote !== null)
  const yesVotes = voters.filter((p) => p.vote === 'in').length
  const noVotes = voters.filter((p) => p.vote === 'out').length
  const total = voters.length
  const verdict = total > 0 ? (noVotes > yesVotes ? 'cancelled' : 'on') : null

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'transparent',
          color: '#555',
          border: 'none',
          fontFamily: 'Poppins',
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginBottom: '2rem',
          padding: 0,
        }}
      >
        ← back to dashboard
      </button>

      {/* Event title */}
      <h1 style={{ color: 'var(--blue)', fontSize: '2rem', marginBottom: '0.3rem' }}>
        {event.name}
      </h1>
      <p
        style={{
          color: '#666',
          fontFamily: 'Poppins',
          fontSize: '0.875rem',
          marginBottom: '2rem',
        }}
      >
        {formatDate(event.date)}
      </p>

      {/* Verdict banner */}
      {verdict && (
        <div
          style={{
            background: verdict === 'cancelled' ? '#1a1a1a' : '#0e1f14',
            border: `1px solid ${verdict === 'cancelled' ? '#333' : '#1a4a28'}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            {verdict === 'cancelled' ? '🛋️' : '😬'}
          </div>
          <p
            style={{
              fontFamily: 'Nunito',
              fontWeight: 900,
              fontSize: '1.1rem',
              lineHeight: 1.55,
              color: verdict === 'cancelled' ? 'var(--white)' : '#6ee08a',
            }}
          >
            {verdict === 'cancelled'
              ? "it's official. this event is cancelled. your friends are flake af."
              : "i'm so sorry, but it's still on. go find your pants."}
          </p>
        </div>
      )}

      {/* Vote tally */}
      <div
        style={{
          background: '#161616',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
        }}
      >
        <p
          style={{
            fontFamily: 'Poppins',
            fontSize: '0.7rem',
            color: '#555',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1.25rem',
          }}
        >
          the vote
        </p>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                fontSize: '3rem',
                fontFamily: 'Nunito',
                fontWeight: 900,
                color: 'var(--blue)',
                lineHeight: 1,
                marginBottom: '0.4rem',
              }}
            >
              {yesVotes}
            </div>
            <div style={{ fontFamily: 'Poppins', color: '#666', fontSize: '0.85rem' }}>
              i'll be there
            </div>
          </div>

          <div style={{ width: '1px', background: '#242424', flexShrink: 0 }} />

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                fontSize: '3rem',
                fontFamily: 'Nunito',
                fontWeight: 900,
                color: '#ff6b6b',
                lineHeight: 1,
                marginBottom: '0.4rem',
              }}
            >
              {noVotes}
            </div>
            <div style={{ fontFamily: 'Poppins', color: '#666', fontSize: '0.85rem' }}>
              want to cancel
            </div>
          </div>
        </div>

        {total === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: '#444',
              fontFamily: 'Poppins',
              fontSize: '0.875rem',
              marginTop: '1.25rem',
            }}
          >
            no votes yet. share the link below!
          </p>
        )}
      </div>

      {/* Voter list */}
      {voters.length > 0 && (
        <div
          style={{
            background: '#161616',
            border: '1px solid #242424',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          <p
            style={{
              fontFamily: 'Poppins',
              fontSize: '0.7rem',
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            who voted
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {voters.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Poppins', fontSize: '0.9rem', color: '#ccc' }}>
                  {p.name}
                </span>
                <span
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    background: p.vote === 'in' ? '#1a3035' : '#2a1515',
                    color: p.vote === 'in' ? 'var(--blue)' : '#ff6b6b',
                  }}
                >
                  {p.vote === 'in' ? "i'll be there" : 'want to cancel'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy invite link */}
      <button
        onClick={copyLink}
        style={{
          background: copied ? '#1a3035' : '#161616',
          color: copied ? 'var(--blue)' : '#666',
          border: `1px solid ${copied ? 'var(--blue)' : '#2e2e2e'}`,
          padding: '0.8rem 1.25rem',
          borderRadius: '8px',
          fontFamily: 'Poppins',
          fontSize: '0.875rem',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.15s',
        }}
      >
        {copied ? '✓ link copied!' : 'copy invite link'}
      </button>
    </div>
  )
}
