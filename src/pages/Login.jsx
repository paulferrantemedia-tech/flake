import { supabase } from '../lib/supabase'

export default function Login() {
  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1.25rem',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '3.5rem',
          color: 'var(--blue)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        flake
      </h1>
      <p
        style={{
          color: '#666',
          fontFamily: 'Poppins',
          fontSize: '0.95rem',
          maxWidth: '280px',
          lineHeight: 1.5,
        }}
      >
        for people who RSVP yes, but really mean no.
      </p>
      <button
        onClick={handleLogin}
        style={{
          background: 'var(--blue)',
          color: 'var(--black)',
          border: 'none',
          padding: '0.85rem 2.25rem',
          borderRadius: '8px',
          fontFamily: 'Nunito',
          fontWeight: 900,
          fontSize: '1rem',
          cursor: 'pointer',
          marginTop: '0.5rem',
        }}
      >
        sign in with google
      </button>
    </div>
  )
}
