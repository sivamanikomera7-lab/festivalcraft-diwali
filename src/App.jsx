import React, { useEffect, useRef, useState } from "react";

const money = 10;
const isGiftRoute = () => /^\/gift\/[a-f0-9]{36}$/.test(window.location.pathname);

function playCrackers() {
  // Synthesized firecracker-like pops; no third-party sound file required.
  // Must be called directly from a user tap to comply with browser audio rules.
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < 16; i++) {
      const start = now + i * (0.075 + Math.random() * 0.09);
      const duration = 0.025 + Math.random() * 0.055;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / data.length);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.7 + Math.random() * 0.5, start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      source.connect(gain);
      gain.connect(master);
      source.start(start);
      source.stop(start + duration);
    }
    const low = ctx.createOscillator();
    const lowGain = ctx.createGain();
    low.type = "triangle";
    low.frequency.setValueAtTime(100, now);
    low.frequency.exponentialRampToValueAtTime(42, now + 0.4);
    lowGain.gain.setValueAtTime(0.001, now);
    lowGain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    low.connect(lowGain);
    lowGain.connect(master);
    low.start(now);
    low.stop(now + 0.5);
    window.setTimeout(() => ctx.close().catch(() => {}), 1800);
  } catch { /* Audio is an enhancement; greeting must still open if unavailable. */ }
}

function Fireworks({ active = true }) {
  return <div className={`fireworks ${active ? "fireworks-active" : ""}`} aria-hidden="true">
    {Array.from({ length: 36 }, (_, i) => <i key={i} style={{
      "--x": `${(i * 37 + 9) % 100}%`,
      "--y": `${(i * 23 + 7) % 68}%`,
      "--delay": `${(i % 9) * 0.17}s`,
      "--hue": `${(i * 43) % 360}deg`
    }} />)}
  </div>;
}

function GiftPage({ giftId }) {
  const [gift, setGift] = useState(null);
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    fetch(`/api/gifts/${giftId}`).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Gift not found.");
      setGift(data);
    }).catch(e => setError(e.message));
  }, [giftId]);

  function openGift() {
    playCrackers();
    setOpened(true);
  }

  const photos = gift?.photos || [];
  useEffect(() => {
    if (photos.length < 2 || !opened) return;
    const timer = window.setInterval(() => setSlide(s => (s + 1) % photos.length), 3500);
    return () => window.clearInterval(timer);
  }, [photos.length, opened]);

  if (error) return <main className="gift-state"><div className="state-card"><span>🪔</span><h1>Gift link not found</h1><p>This link may be invalid or the gift has not finished processing.</p><a className="primary-button" href="/">Create a Diwali gift</a></div></main>;
  if (!gift) return <main className="gift-state"><div className="state-card"><span className="loading-lamp">🪔</span><h1>Lighting the diyas…</h1><p>Preparing your special Diwali surprise.</p></div></main>;

  return <main className={`gift-page ${opened ? "gift-is-open" : ""}`}>
    <div className="gift-sky" /><Fireworks active={opened} />
    {!opened ? <section className="gift-open-screen">
      <div className="mini-diyas">🪔　✨　🪔</div>
      <p className="eyebrow">A LITTLE SURPRISE JUST FOR YOU</p>
      <h1>Your Diwali<br /><span>gift is waiting.</span></h1>
      <p className="gift-intro">A little light, a little love, and a special wish made just for you.</p>
      <button className="big-gift" onClick={openGift} aria-label="Tap to open your Diwali gift">
        <span className="gift-glow" /><span className="gift-box"><i className="gift-ribbon-v" /><i className="gift-ribbon-h" /><i className="gift-bow">∞</i></span>
        <span className="tap-label">TAP TO OPEN <b>↗</b></span>
      </button>
      <p className="sound-hint">🔊 Tap the gift to start the crackers sound and fireworks</p>
    </section> : <section className="revealed-gift">
      <div className="reveal-top">✦ A FESTIVALCRAFT DIWALI WISH ✦</div>
      <div className="deity-medallion"><span>ॐ</span><div>🪔</div></div>
      <p className="eyebrow">HAPPY DIWALI</p>
      <h1>Dear <span>{gift.receiver}</span></h1>
      <p className="gift-message">{gift.message}</p>
      {photos.length > 0 && <div className="photo-carousel">
        <div className="slide-frame"><img key={photos[slide]} src={photos[slide]} alt={`Gift memory ${slide + 1}`} /></div>
        {photos.length > 1 && <div className="carousel-controls">
          <button onClick={() => setSlide(s => (s - 1 + photos.length) % photos.length)} aria-label="Previous photo">←</button>
          <span>{slide + 1} / {photos.length}</span>
          <button onClick={() => setSlide(s => (s + 1) % photos.length)} aria-label="Next photo">→</button>
        </div>}
      </div>}
      {gift.audio && <div className="voice-card"><span>🎙️ A voice message for you</span><audio controls preload="metadata" src={gift.audio} /></div>}
      <div className="gold-divider">✧　✦　✧</div>
      <p className="blessing">May your home glow with happiness, your heart with peace, and your life with endless light.</p>
      <p className="from-line">With love, <strong>{gift.sender}</strong></p>
      <button className="share-button" onClick={async () => {
        const url = window.location.href;
        if (navigator.share) { try { await navigator.share({ title: "A Diwali gift for you", text: "Open your special Diwali surprise!", url }); } catch {} }
        else { try { await navigator.clipboard.writeText(url); alert("Gift link copied!"); } catch { alert(url); } }
      }}>Share this moment ↗</button>
    </section>}
    <footer className="gift-footer">Made with light & love · FestivalCraft</footer>
  </main>;
}

function Builder() {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("May your Diwali shine with happiness, love and prosperity!");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [fireworksDemo, setFireworksDemo] = useState(false);
  const fileInput = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => () => {
    photoPreviews.forEach(p => URL.revokeObjectURL(p.url));
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [photoPreviews, audioUrl]);

  function addPhotos(event) {
    setStatus("");
    const incoming = Array.from(event.target.files || []);
    const valid = incoming.filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (valid.length !== incoming.length) setStatus("ప్రతి photo JPG/PNG/WebP వంటి image అయి ఉండాలి; ఒక్కోటి 5 MBలోపు ఉండాలి.");
    const combined = [...photoFiles, ...valid].slice(0, 10);
    if (photoFiles.length + valid.length > 10) setStatus("గరిష్ఠంగా 10 photos మాత్రమే add చేయగలరు.");
    setPhotoFiles(combined);
    setPhotoPreviews(combined.map(file => ({ file, url: URL.createObjectURL(file) })));
    event.target.value = "";
  }

  function removePhoto(index) {
    URL.revokeObjectURL(photoPreviews[index].url);
    setPhotoFiles(old => old.filter((_, i) => i !== index));
    setPhotoPreviews(old => old.filter((_, i) => i !== index));
  }

  async function startRecording() {
    setRecordError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordError("Voice recording కోసం Chromeలో localhost లేదా HTTPS ఉపయోగించండి.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
    } catch {
      setRecordError("Microphone permission allow చేయండి. Browser settingsలో microphone block కాకూడదు.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function pay() {
    setStatus("");
    if (!sender.trim() || !receiver.trim()) { setStatus("మీ పేరు, gift అందుకునే వారి పేరు enter చేయండి."); return; }
    if (message.trim().length < 3) { setStatus("Greeting message enter చేయండి."); return; }
    if (!window.Razorpay) { setStatus("Razorpay checkout load కాలేదు. Internet connection check చేసి refresh చేయండి."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, receiver, message, amount: 1000, currency: "INR", festivalId: "diwali" })
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error || "Order create కాలేదు.");
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: "FestivalCraft Diwali", description: "Personalized Diwali Gift — ₹10",
        order_id: order.orderId, theme: { color: "#e8b75a" },
        handler: async result => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.orderId, razorpay_payment_id: result.razorpay_payment_id, razorpay_order_id: result.razorpay_order_id, razorpay_signature: result.razorpay_signature })
            });
            const verified = await verifyRes.json();
            if (!verifyRes.ok || !verified.verified) throw new Error(verified.error || "Payment verify కాలేదు.");
            const form = new FormData();
            photoFiles.forEach(file => form.append("photos", file));
            if (audioBlob) form.append("audio", audioBlob, "voice-message.webm");
            const mediaRes = await fetch(`/api/gifts/${verified.giftId}/media`, { method: "POST", body: form });
            const mediaData = await mediaRes.json();
            if (!mediaRes.ok) throw new Error(mediaData.error || "Gift media save కాలేదు. Payment status verify చేసి supportను సంప్రదించండి.");
            const giftUrl = `${window.location.origin}/gift/${verified.giftId}`;
            setStatus(`Payment verified! Gift ready. Link: ${giftUrl}`);
            window.history.pushState({}, "", `/gift/${verified.giftId}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch (e) {
            setStatus(`Payment response: ${e.message} మీ payment status కోసం Razorpay dashboardలో verify చేయండి.`);
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => { setBusy(false); setStatus("Checkout close అయింది. Payment statusను verify చేయండి."); } }
      });
      checkout.on("payment.failed", e => { setStatus(`Payment failed: ${e.error?.description || "Please try again."}`); setBusy(false); });
      checkout.open();
    } catch (e) { setStatus(e.message || "ఏదో తప్పు జరిగింది."); setBusy(false); }
  }

  return <main className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">✦</span> FestivalCraft</a><span className="top-tag">A little magic. A lifetime memory.</span><a className="nav-cta" href="#create">Create a gift ↗</a></header>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> A DIWALI SURPRISE MADE PERSONAL</div>
        <h1>Make their Diwali<br /><span>unforgettable.</span></h1>
        <p className="hero-description">A beautiful surprise made just for someone special — fireworks, your favourite photos, heartfelt wishes and your own voice.</p>
        <div className="hero-actions"><a className="primary-button" href="#create">Create your gift <span>→</span></a><span className="no-app">One gift · Just ₹10</span></div>
        <div className="trust-row"><span>✧ Fireworks reveal</span><span>✧ Multiple photos</span><span>✧ Voice wishes</span></div>
      </div>
      <div className="hero-art">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="halo" />
        <div className="floating-star star-a">✦</div><div className="floating-star star-b">✧</div><div className="floating-star star-c">✦</div>
        <div className="hero-deity"><img src="/deities/lakshmi-placeholder.svg" alt="Lakshmi artwork placeholder" /><div className="deity-caption"><span>DIVINE BLESSINGS</span><strong>Shubh Deepavali</strong></div></div>
        <div className="diya diya-left"><span className="flame" /><span className="diya-bowl" /></div><div className="diya diya-right"><span className="flame" /><span className="diya-bowl" /></div><div className="hero-bottom-glow" />
      </div>
    </section>
    <section className="feature-strip"><div><span className="section-kicker">A SURPRISE THEY CAN FEEL</span><h2>Not just a wish. A memory.</h2></div><div className="feature-pills"><span>🎆 Crackers sound</span><span>📸 Up to 10 photos</span><span>🎙️ Voice message</span><span>🪔 Diwali-only theme</span></div></section>
    <section className="builder-section" id="create">
      <div className="builder-intro"><span className="section-kicker">YOUR STORY, YOUR WAY</span><h2>Create a gift<br />from the heart.</h2><p>Personalise it, add memories, and send one beautiful Diwali link.</p>
        <div className="builder-perk"><span>01</span><div><strong>Add your names</strong><small>Make the greeting truly personal.</small></div></div>
        <div className="builder-perk"><span>02</span><div><strong>Choose your memories</strong><small>Add up to 10 photos. They slide automatically in the gift.</small></div></div>
        <div className="builder-perk"><span>03</span><div><strong>Record your voice</strong><small>Let them hear your own Diwali wish.</small></div></div>
      </div>
      <div className="builder-card">
        <div className="card-topline"><span>✦ YOUR DIWALI GIFT</span><span className="live-badge"><i /> LIVE PREVIEW</span></div>
        <div className="form-grid"><label>Your name<input value={sender} onChange={e => setSender(e.target.value)} maxLength={60} placeholder="e.g. Siva" /></label><label>Gift for<input value={receiver} onChange={e => setReceiver(e.target.value)} maxLength={60} placeholder="e.g. Amma & Nanna" /></label></div>
        <label className="full-label">Your Diwali wish<textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={3} /></label>
        <div className="upload-row"><div className="upload-icon">▧</div><div className="upload-copy"><strong>Add your photos</strong><small>Up to 10 images · JPG, PNG or WebP · max 5 MB each</small></div><input ref={fileInput} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} /><button className="outline-button" onClick={() => fileInput.current?.click()}>+ Add photos</button></div>
        {photoPreviews.length > 0 && <div className="photo-grid">{photoPreviews.map((p, i) => <div className="photo-thumb" key={`${p.file.name}-${i}`}><img src={p.url} alt={`Selected photo ${i+1}`} /><span>{i+1}</span><button onClick={() => removePhoto(i)} aria-label={`Remove photo ${i+1}`}>×</button></div>)}</div>}
        <div className="voice-row"><div className="voice-icon">♫</div><div className="upload-copy"><strong>Your voice, their memory</strong><small>Record a voice wish. It will be attached to your gift.</small></div>{!recording ? <button className="outline-button" onClick={startRecording}>● Record</button> : <button className="record-button" onClick={stopRecording}>■ Stop</button>}</div>
        {recordError && <p className="inline-error">{recordError}</p>}
        {audioUrl && <div className="audio-preview"><audio controls src={audioUrl} /><button onClick={() => { URL.revokeObjectURL(audioUrl); setAudioUrl(""); setAudioBlob(null); }}>Remove recording</button></div>}
        <div className="preview-card"><div className="preview-spark">✦ ✧ ✦</div><span>HAPPY DIWALI</span><h3>{receiver.trim() || "Someone Special"}</h3>{photoPreviews.length > 0 && <img className="preview-photo" src={photoPreviews[0].url} alt="First photo preview" />}{photoPreviews.length > 1 && <small>+ {photoPreviews.length - 1} more photo{photoPreviews.length > 2 ? "s" : ""} · slides in gift</small>}<p>{message || "Your beautiful Diwali message will appear here."}</p><div className="preview-diya">🪔 ✨ 🪔</div><small>With love, {sender.trim() || "Your Name"}</small></div>
        <div className="pricing-row"><div><small>PERSONALISED DIWALI GIFT</small><div className="price">₹10 <span>/ one gift</span></div></div><span className="fixed-price">One simple price</span></div>
        <button className="pay-button" disabled={busy} onClick={pay}>{busy ? "Please wait…" : <>Pay ₹10 & create gift <span>→</span></>}</button>
        <p className="payment-note">Razorpay secure checkout · Test mode until your own keys are configured</p>
        {status && <div className="status-message" role="status">{status}</div>}
      </div>
    </section>
    <section className="closing-banner"><div className="closing-stars">✦　✧　✦</div><p>ONE TAP. A BURST OF LIGHT. A MEMORY FOREVER.</p><h2>Light up someone’s Diwali.</h2><a href="#create">Create your ₹10 gift ↗</a></section>
    <footer><a className="brand" href="#"><span className="brand-mark">✦</span> FestivalCraft</a><span>Made with light & love.</span><span>© {new Date().getFullYear()} FestivalCraft</span></footer>
  </main>;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener("popstate", handler); return () => window.removeEventListener("popstate", handler); }, []);
  const match = path.match(/^\/gift\/([a-f0-9]{36})$/);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);
  return match ? <GiftPage key={match[1]} giftId={match[1]} /> : <Builder />;
}
