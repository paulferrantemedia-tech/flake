import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [createdEvents, setCreatedEvents] = useState([])
  const [invitedEvents, setInvitedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (user) fetchEvents()
  }, [user])

  async function fetchEvents() {
    setLoading(true)

    // Events this user created
    const { data: created } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user.id)
      .order('date', { ascending: true })

    // Events this user was invited to (participant but not organizer)
    const { data: participantRows } = await supabase
      .from('participants')
      .select('event_id')
      .eq('user_id', user.id)
      .eq('is_organizer', false)

    let invited = []
    if (participantRows && participantRows.length > 0) {
      const eventIds = participantRows.map((p) => p.event_id)
      const { data: invitedData } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true })
      invited = invitedData || []
    }

    setCreatedEvents(created || [])
    setInvitedEvents(invited)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function copyLink(token, eventId) {
    navigator.clipboard.writeText(`${window.location.origin}/vote/${token}`)
    setCopiedId(eventId)
    setTimeout(() => setCopiedId(null), 2000)
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

  if (loading) return <div className="loading">loading your events...</div>

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
        }}
      >
        <h1 style={{ fontSize: '2.25rem', color: 'var(--blue)', letterSpacing: '-0.02em' }}>
          flake
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#666',
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            fontFamily: 'Poppins',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          log out
        </button>
      </div>

      {/* Create event button */}
      <button
        onClick={() => navigate('/create-event')}
        style={{
          background: 'var(--blue)',
          color: 'var(--black)',
          border: 'none',
          padding: '0.9rem 1.75rem',
          borderRadius: '8px',
          fontFamily: 'Nunito',
          fontWeight: 900,
          fontSize: '1rem',
          cursor: 'pointer',
          marginBottom: '2.5rem',
          width: '100%',
        }}
      >
        + create a new event
      </button>

      {/* Events you created */}
      <section style={{ marginBottom: '3rem' }}>
        <p
          style={{
            fontFamily: 'Poppins',
            fontSize: '0.75rem',
            color: '#555',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
          }}
        >
          events you created
        </p>
        {createdEvents.length === 0 ? (
          <p style={{ color: '#444', fontFamily: 'Poppins', fontSize: '0.95rem' }}>
            no events yet. make one above!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {createdEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isOrganizer={true}
                copiedId={copiedId}
                onCopy={copyLink}
                onViewResults={() => navigate(`/event/${event.id}/results`)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Events you're invited to */}
      <section>
        <p
          style={{
            fontFamily: 'Poppins',
            fontSize: '0.75rem',
            color: '#555',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
          }}
        >
          events you're invited to
        </p>
        {invitedEvents.length === 0 ? (
          <p style={{ color: '#444', fontFamily: 'Poppins', fontSize: '0.95rem' }}>
            nothing here. you might just have to show up to things.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {invitedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isOrganizer={false}
                copiedId={copiedId}
                onCopy={copyLink}
                onViewResults={null}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EventCard({ event, isOrganizer, copiedId, onCopy, onViewResults, formatDate }) {
  return (
    <div
      style={{
        background: '#161616',
        border: '1px solid #242424',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      <div>
        <h3
          style={{
            fontFamily: 'Nunito',
            fontWeight: 900,
            fontSize: '1.2rem',
            marginBottom: '0.2rem',
          }}
        >
          {event.name}
        </h3>
        <p style={{ color: '#666', fontFamily: 'Poppins', fontSize: '0.85rem' }}>
          {formatDate(event.date)}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onCopy(event.token, event.id)}
          style={{
            background: copiedId === event.id ? '#1a3035' : '#1e1e1e',
            color: copiedId === event.id ? 'var(--blue)' : '#888',
            border: `1px solid ${copiedId === event.id ? 'var(--blue)' : '#2e2e2e'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            fontFamily: 'Poppins',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copiedId === event.id ? '✓ copied!' : 'copy invite link'}
        </button>

        {isOrganizer && (
          <button
            onClick={onViewResults}
            style={{
              background: 'transparent',
              color: 'var(--blue)',
              border: '1px solid var(--blue)',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              fontFamily: 'Poppins',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            see results →
          </button>
        )}
      </div>
    </div>
  )
}
