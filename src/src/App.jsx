
import React, { useState } from 'react';

export default function App() {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState(
    'May your Diwali shine with happiness, love and prosperity!'
  );

  return (
    <main className="page">
      <section className="gift-card">
        <p className="eyebrow">✨ FESTIVALCRAFT ✨</p>
        <h1>Happy Diwali 🪔</h1>
        <p className="subtitle">
          Create a beautiful, personalized Diwali greeting.
        </p>

        <label htmlFor="sender">Your name</label>
        <input
          id="sender"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          placeholder="Enter your name"
          maxLength={60}
        />

        <label htmlFor="receiver">Send to</label>
        <input
          id="receiver"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          placeholder="Enter receiver's name"
          maxLength={60}
        />

        <label htmlFor="message">Your greeting</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={4}
        />

        <div className="preview">
          <span>🪔 🪷 🪔</span>
          <h2>Happy Diwali, {receiver.trim() || 'Friend'}!</h2>
          <p>{message}</p>
          <p>With love, {sender.trim() || 'Your Friend'}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            const text = `Happy Diwali, ${receiver}!\n\n${message}\n\nWith love, ${sender}`;
            if (navigator.share) {
              navigator.share({ title: 'Happy Diwali', text }).catch(() => {});
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(text)
                .then(() => alert('Greeting copied!'))
                .catch(() => alert(text));
            } else {
              alert(text);
            }
          }}
        >
          Share Greeting
        </button>

        <p className="note">
          Personalized greeting preview · FestivalCraft Diwali
        </p>
      </section>
    </main>
  );
}
