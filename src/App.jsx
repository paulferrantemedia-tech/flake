import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BG = "#0a0a0a";
const BLUE = "#88EAF6";

function formatEmail(val) { return val; }

function getDefaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: BLUE, color: BG, padding: "12px 24px", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap", zIndex: 999, borderRadius: 100 }}>{msg}</div>
  );
}

function Logo({ size = "1.7rem" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, lineHeight: 1 }}>
      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: size, fontWeight: 900, color: "#ffffff", letterSpacing: 2 }}>F</span>
      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: size, fontWeight: 900, color: "#88EAF6", letterSpacing: 2 }}>LA</span>
      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: size, fontWeight: 900, color: "#ffffff", letterSpacing: 2 }}>KE</span>
    </div>
  );
}

function Home({ onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "82vh", padding: "40px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ffffff", marginBottom: 24 }}>for people who hate going out but love getting invited</p>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 9vw, 4.8rem)", lineHeight: 1.05, marginBottom: 16, maxWidth: 560, color: "#ffffff" }}>
        Why RSVP when you can{" "}<span style={{ color: "#88EAF6", whiteSpace: "nowrap" }}>S-T-A-Y in</span>
      </h1>
      <p style={{ fontSize: 13, letterSpacing: "0.04em", color: "#ffffff", marginBottom: 8 }}>not everything has to make it out the group chat</p>
      <p style={{ fontSize: 14, color: "#ffffff", maxWidth: 340, lineHeight: 1.7, margin: "24px 0 40px", fontWeight: 300 }}>vote to bail in secret. when enough people tap out, everyone finds out.</p>
      <button onClick={onStart} style={{ background: "#88EAF6", color: "#0a0a0a", border: "none", padding: "14px 40px", borderRadius: 100, fontSize: 13, letterSpacing: "0.08em", textTransform: "lowercase", cursor: "pointer", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>create a plan →</button>
      <div style={{ display: "flex", marginTop: 64, width: "100%", maxWidth: 560 }}>
        {[["01", "create a plan & add your people"], ["02", "everyone votes secretly: in or quietly out"], ["03", "majority bails? cancelled. no one knows who folded."]].map(([num, text], i, arr) => (
          <div key={num} style={{ flex: 1, padding: "20px 14px", borderTop: "1px solid #222222", borderRight: i < arr.length - 1 ? "1px solid #222222" : "none", textAlign: "left" }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.6rem", color: "#88EAF6", lineHeight: 1, marginBottom: 10, fontWeight: 900 }}>{num}</div>
            <div style={{ fontSize: 11, color: "#ffffff", lineHeight: 1.6 }}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#666666", marginBottom: 8, fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ style = {}, ...props }) {
  return <input {...props} style={{ width: "100%", border: "1px solid #222222", background: "#111", padding: "12px 14px", fontSize: 14, color: "#ffffff", outline: "none", fontFamily: "'Poppins', sans-serif", borderRadius: 8, boxSizing: "border-box", ...style }} />;
}

function CreateScreen({ onBack, onCreate }) {
  const [planName, setPlanName] = useState("");
  const [date, setDate] = useState(getDefaultDate());
  const [people, setPeople] = useState([{ name: "", email: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updatePerson(i, field, val) {
    const next = [...people];
    next[i] = { ...next[i], [field]: val };
    setPeople(next);
  }

  function addPerson() { setPeople([...people, { name: "", email: "" }]); }

  function removePerson(i) {
    if (people.length <= 1) { setError("need at least one person"); return; }
    setPeople(people.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!planName.trim()) { setError("give the plan a name"); return; }
    if (!date) { setError("pick a date"); return; }
    const valid = people.filter(p => p.name.trim() || p.email.trim());
    if (valid.length === 0) { setError("add at least one person"); return; }
    setError("");
    setLoading(true);

    const dateStr = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({ name: planName.trim(), date: dateStr })
      .select()
      .single();

    if (eventError) { setError("something went wrong. try again."); setLoading(false); return; }

    const participants = [
      { event_id: eventData.id, name: "you (organizer)", email: null, is_organizer: true },
      ...valid.map(p => ({ event_id: eventData.id, name: p.name.trim() || p.email, email: p.email.trim() || null, is_organizer: false }))
    ];

    await supabase.from("participants").insert(participants);
    setLoading(false);
    onCreate(eventData.id);
  }

  const total = people.length + 1;
  const threshold = Math.ceil(total / 2);

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "36px 20px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#666666", fontSize: 12, cursor: "pointer", marginBottom: 28, padding: 0, fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>← back</button>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2rem", fontWeight: 900, marginBottom: 6, color: "#ffffff", textTransform: "lowercase" }}>new plan</div>
      <p style={{ color: "#ffffff", fontSize: 13, marginBottom: 36 }}>fill this out. your friends will never know you're already hoping they cancel.</p>
      <Field label='what are you "definitely" doing'><Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="dinner at that place you both said you loved" /></Field>
      <Field label="when is it"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="who's invited — name & email">
        {people.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <Input value={p.name} onChange={e => updatePerson(i, "name", e.target.value)} placeholder="name" style={{ flex: 1 }} />
            <Input type="email" value={p.email} onChange={e => updatePerson(i, "email", e.target.value)} placeholder="email@example.com" style={{ flex: 1.3 }} />
            <button onClick={() => removePerson(i)} style={{ background: "none", border: "1px solid #222222", color: "#666666", width: 40, height: 44, cursor: "pointer", fontSize: 18, flexShrink: 0, borderRadius: 4 }}>×</button>
          </div>
        ))}
        <button onClick={addPerson} style={{ background: "none", border: "1px dashed #222222", color: "#666666", padding: "10px 16px", fontSize: 12, cursor: "pointer", width: "100%", marginTop: 4, borderRadius: 4, fontFamily: "'Poppins', sans-serif" }}>+ add another person</button>
        <p style={{ fontSize: 11, color: "#666666", marginTop: 8 }}>{total} people total · cancels if {threshold} or more vote out</p>
      </Field>
      {error && <p style={{ color: "#ff4444", fontSize: 13, marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <button onClick={handleCreate} disabled={loading} style={{ background: "#88EAF6", color: "#0a0a0a", border: "none", padding: "13px 36px", borderRadius: 100, fontSize: 13, cursor: "pointer", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>{loading ? "creating..." : "create plan"}</button>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #222222", color: "#666666", padding: "13px 24px", borderRadius: 100, fontSize: 12, cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}>never mind</button>
      </div>
    </div>
  );
}

function EventScreen({ eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [votingOpen, setVotingOpen] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  async function loadEvent() {
    const { data: ev } = await supabase.from("events").select("*").eq("id", eventId).single();
    const { data: parts } = await supabase.from("participants").select("*").eq("event_id", eventId);
    setEvent(ev);
    setParticipants(parts || []);
    setLoading(false);
  }

  useEffect(() => { loadEvent(); }, [eventId]);

  useEffect(() => {
    const channel = supabase.channel("votes-" + eventId)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `event_id=eq.${eventId}` }, () => { loadEvent(); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventId]);

  async function handleVote(participantId, vote) {
    await supabase.from("participants").update({ vote }).eq("id", participantId);
    await loadEvent();
    const updated = await supabase.from("participants").select("*").eq("event_id", eventId);
    const parts = updated.data || [];
    const total = parts.length;
    const outVotes = parts.filter(p => p.vote === "out").length;
    const threshold = Math.ceil(total / 2);
    if (outVotes >= threshold) showToast("plans cancelled. couch wins again.");
    else if (parts.every(p => p.vote !== null)) showToast("you're going. condolences.");
  }

  if (loading) return <div style={{ color: "#fff", textAlign: "center", padding: 60 }}>loading...</div>;
  if (!event) return <div style={{ color: "#fff", textAlign: "center", padding: 60 }}>event not found.</div>;

  const total = participants.length;
  const outVotes = participants.filter(p => p.vote === "out").length;
  const pct = total > 0 ? Math.round((outVotes / total) * 100) : 0;
  const threshold = Math.ceil(total / 2);
  const allVoted = participants.every(p => p.vote !== null);
  const resolved = outVotes >= threshold || allVoted;
  const cancelled = outVotes >= threshold;
  const myParticipant = identity !== null ? participants[identity] : null;
  const myVote = myParticipant?.vote || null;

  function sendReminder() { setReminderSent(true); setTimeout(() => setVotingOpen(true), 1200); }

  if (identity === null) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "36px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#666666", fontSize: 12, cursor: "pointer", marginBottom: 28, padding: 0, fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>← back</button>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.8rem", fontWeight: 900, marginBottom: 6, color: "#ffffff", textTransform: "lowercase" }}>who are you?</div>
        <p style={{ color: "#ffffff", fontSize: 13, marginBottom: 32 }}>pick your name. you'll only be able to vote for yourself.</p>
        {participants.map((p, i) => (
          <button key={i} onClick={() => setIdentity(i)} style={{ display: "block", width: "100%", textAlign: "left", padding: "15px 20px", border: "1px solid #222222", background: "#111", marginBottom: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#ffffff", fontFamily: "'Poppins', sans-serif", borderRadius: 10 }}>{p.name}</button>
        ))}
        <div style={{ marginTop: 24, padding: 16, background: "#111", borderRadius: 10, border: "1px solid #222" }}>
          <p style={{ fontSize: 11, color: "#666", margin: 0 }}>share this page link with your group so everyone can vote</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "36px 20px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#666666", fontSize: 12, cursor: "pointer", marginBottom: 28, padding: 0, fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>← back</button>
      <div style={{ background: "#111", borderRadius: 14, padding: 24, marginBottom: 16, position: "relative" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#666666", marginBottom: 8 }}>the plan</div>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.6rem", fontWeight: 900, lineHeight: 1.1, marginBottom: 14, color: "#ffffff", textTransform: "lowercase" }}>{event.name}</div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#666666" }}>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>{event.date}</span>
          <span>{total} people</span>
        </div>
        <div style={{ position: "absolute", top: 16, right: 16, padding: "5px 14px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, borderRadius: 100, fontFamily: "'Poppins', sans-serif", background: resolved ? (cancelled ? "#ff4444" : "#88EAF6") : "#222222", color: resolved ? "#0a0a0a" : "#ffffff" }}>
          {resolved ? (cancelled ? "cancelled" : "it's on") : "active"}
        </div>
      </div>

      {!votingOpen && !resolved && (
        <div style={{ background: "#111", borderRadius: 14, padding: 24, marginBottom: 16, textAlign: "center" }}>
          {!reminderSent ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#ffffff", textTransform: "lowercase" }}>3-day reminder</div>
              <p style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.7, marginBottom: 20 }}>in the real app, everyone gets a text 3 days before. voting opens then — not before.</p>
              <button onClick={sendReminder} style={{ background: "#88EAF6", color: "#0a0a0a", border: "none", padding: "11px 28px", borderRadius: 100, fontSize: 12, cursor: "pointer", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>simulate reminder sent</button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#666666" }}>sending reminders… opening voting now ✦</div>
          )}
        </div>
      )}

      {(votingOpen || resolved) && (
        <div style={{ background: "#111", borderRadius: 14, padding: "18px 22px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#666666", marginBottom: 10 }}>
            <span>bail-o-meter</span>
            <span style={{ color: resolved ? "#ffffff" : "#666666" }}>{resolved ? `${pct}% wanted out` : "?? % — votes hidden"}</span>
          </div>
          <div style={{ height: 5, background: "#222222", borderRadius: 99, position: "relative" }}>
            <div style={{ height: "100%", background: "#88EAF6", width: resolved ? `${pct}%` : "0%", transition: "width 0.6s ease", borderRadius: 99 }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 2, height: 14, background: "#ffffff", transform: "translate(-50%, -50%)" }} />
          </div>
          <p style={{ fontSize: 11, color: "#ffffff", marginTop: 12 }}>{resolved ? `${outVotes} of ${total} voted out · threshold was ${threshold}` : "votes are secret until the majority tips"}</p>
        </div>
      )}

      {(votingOpen || resolved) && (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#666666", marginBottom: 12, fontWeight: 700 }}>your vote</div>
          <div style={{ padding: "16px 18px", borderRadius: 10, marginBottom: 10, border: `1px solid ${myVote ? (myVote === "in" ? "#88EAF6" : "#ff4444") : "#222222"}`, background: myVote ? (myVote === "in" ? "rgba(136,234,246,0.07)" : "rgba(255,68,68,0.07)") : "#111" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", fontFamily: "'Poppins', sans-serif" }}>{myParticipant?.name} <span style={{ fontSize: 11, color: "#666666", fontWeight: 400 }}>· you</span></div>
                {myVote && <div style={{ fontSize: 11, textTransform: "lowercase", color: myVote === "in" ? "#88EAF6" : "#ff4444", marginTop: 4, fontWeight: 700 }}>{myVote === "in" ? "you're in ✓" : "you're out (secretly) ✗"}</div>}
              </div>
              {!myVote && !resolved ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleVote(myParticipant.id, "in")} style={{ padding: "8px 16px", border: "1px solid #88EAF6", background: "transparent", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#88EAF6", borderRadius: 100, fontFamily: "'Poppins', sans-serif" }}>i'm in</button>
                  <button onClick={() => handleVote(myParticipant.id, "out")} style={{ padding: "8px 16px", border: "1px solid #222222", background: "transparent", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#666666", borderRadius: 100, fontFamily: "'Poppins', sans-serif" }}>i'm out</button>
                </div>
              ) : myVote ? <span style={{ fontSize: 22, color: myVote === "in" ? "#88EAF6" : "#ff4444" }}>{myVote === "in" ? "✓" : "✗"}</span> : null}
            </div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#666666", margin: "20px 0 12px", fontWeight: 700 }}>{resolved ? "final votes" : "others"}</div>
          {participants.map((p, i) => {
            if (i === identity) return null;
            return (
              <div key={i} style={{ padding: "14px 18px", border: "1px solid #222222", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 10, background: "#111" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", fontFamily: "'Poppins', sans-serif" }}>{p.name}</div>
                {resolved ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.vote === "in" ? "#88EAF6" : p.vote === "out" ? "#ff4444" : "#666666" }}>{p.vote === "in" ? "in ✓" : p.vote === "out" ? "out ✗" : "no vote"}</span>
                ) : (
                  <span style={{ fontSize: 11, color: "#666666" }}>{p.vote !== null ? "✦ voted" : "waiting…"}</span>
                )}
              </div>
            );
          })}
        </>
      )}

      {resolved && (
        <div style={{ padding: 32, borderRadius: 16, textAlign: "center", marginTop: 24, background: cancelled ? "rgba(255,68,68,0.08)" : "rgba(136,234,246,0.08)", border: `1px solid ${cancelled ? "#ff4444" : "#88EAF6"}` }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>{cancelled ? "🛋️" : "😬"}</div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.6rem", fontWeight: 900, color: cancelled ? "#ff4444" : "#88EAF6", marginBottom: 10, textTransform: "lowercase" }}>{cancelled ? "plans cancelled" : "it's happening"}</div>
          <p style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.7 }}>{cancelled ? "the group has collectively decided to do absolutely nothing. nobody knows who bailed first. you're all cowards. beautiful, honest cowards." : "not enough people bailed. you're going. put on pants."}</p>
        </div>
      )}
      <Toast msg={toast} />
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [eventId, setEventId] = useState(null);
  const [toast, setToast] = useState("");

  document.title = "FLAKE";

  function handleCreate(id) {
    setEventId(id);
    setScreen("event");
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", fontFamily: "'Poppins', sans-serif", color: "#ffffff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #222222" }}>
        <Logo />
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#666666" }}>flake it, don't fake it</div>
      </div>
      {screen === "home" && <Home onStart={() => setScreen("create")} />}
      {screen === "create" && <CreateScreen onBack={() => setScreen("home")} onCreate={handleCreate} />}
      {screen === "event" && eventId && <EventScreen eventId={eventId} onBack={() => setScreen("home")} />}
      <Toast msg={toast} />
    </div>
  );
}