"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage, sendJson } from "./api";
import { ProfileSummary } from "./ProfileSummary";

const GREETING =
  "Labas, aš Spotter. Papasakok apie savo treniruotes: kokia tavo patirtis, kuriomis dienomis ir kiek laiko gali sportuoti, kokią įrangą turi ir ar kas nors skauda.";

export function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const conversation = [...messages, { role: "user", text }];
    setMessages(conversation);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const reply = await sendJson("/api/onboarding", "POST", conversation);
      setMessages([...conversation, { role: "assistant", text: reply.message }]);
      setProfile(reply.profile);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      await sendJson("/api/profile", "PUT", profile);
      router.push("/");
      router.refresh();
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>Profilio sukūrimas</h1>
      <div className="chat" aria-live="polite">
        {messages.map((message, index) => (
          <p key={index} className={message.role === "user" ? "message message-user" : "message"}>
            {message.text}
          </p>
        ))}
        {busy && <p className="message muted">Galvoju…</p>}
      </div>

      {profile && (
        <section className="panel stack">
          <ProfileSummary profile={profile} />
          <div className="row">
            <button className="button button-primary" type="button" onClick={confirm} disabled={busy}>
              Patvirtinti profilį
            </button>
            <span className="muted small">Arba rašyk toliau, jei nori ką nors pakeisti.</span>
          </div>
        </section>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      <form className="composer" onSubmit={send}>
        <input
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Rašyk atsakymą"
          aria-label="Tavo atsakymas"
          disabled={busy}
        />
        <button className="button button-primary" type="submit" disabled={busy || !draft.trim()}>
          Siųsti
        </button>
      </form>
    </div>
  );
}
