import React, { useEffect, useRef } from 'react';
import { PhoneOff, Video, CheckCircle2 } from 'lucide-react';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';

/**
 * CONNECT Incoming Call Modal
 * Matches the reference incoming call UI (media_1794311125052_f2b107c8.jpg):
 * - Top CONNECT branding
 * - "Incoming Video Call" label
 * - Concentric glowing ripple rings with caller photo
 * - Caller name with verified checkmark
 * - Green dot "Online"
 * - "is calling you..." with animated pulsing pink dots
 * - Decline (red) and Accept (green) circular buttons
 * - Web Audio API ring chime
 */
export default function DemoIncomingCallModal({
  caller,
  onAccept,
  onDecline,
}) {
  const audioCtxRef = useRef(null);

  // Play realistic dual-tone phone ring chime using Web Audio API
  useEffect(() => {
    let isCancelled = false;
    let timerId = null;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;

        const playChime = () => {
          if (isCancelled || !ctx || ctx.state === 'closed') return;
          try {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            // Dual frequency standard ring chime: 440Hz + 480Hz
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, ctx.currentTime);
            osc2.frequency.setValueAtTime(480, ctx.currentTime);

            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 1.6);
            osc2.stop(ctx.currentTime + 1.6);
          } catch (e) {}
        };

        playChime();
        timerId = setInterval(playChime, 3200);
      }
    } catch (e) {}

    // Auto-decline after 30 seconds if user does not answer
    const timeoutTimer = setTimeout(() => {
      onDecline?.();
    }, 30000);

    return () => {
      isCancelled = true;
      if (timerId) clearInterval(timerId);
      clearTimeout(timeoutTimer);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch (e) {}
      }
    };
  }, [onDecline]);

  if (!caller) return null;

  return (
    <div className="demo-incoming-overlay" role="dialog" aria-modal="true" aria-label="Incoming Video Call">
      <div className="demo-incoming-card">
        {/* Ambient bottom wave overlay */}
        <div className="demo-incoming-wave-bg" aria-hidden="true" />

        {/* ── Top Header: CONNECT Branding ── */}
        <header className="demo-incoming-header">
          <div className="demo-incoming-brand">
            <img src={heartLogoImg} alt="CONNECT" className="demo-incoming-logo" />
            <span className="demo-incoming-brand-text">CONNECT</span>
          </div>

          <div className="demo-incoming-call-type-badge">
            <div className="demo-video-icon-pill">
              <Video size={16} color="#ffffff" />
            </div>
            <span className="demo-call-label-text">Incoming Video Call</span>
          </div>
        </header>

        {/* ── Center Stage: Concentric Glowing Rings + Avatar ── */}
        <div className="demo-incoming-avatar-stage">
          {/* Concentric ambient glow rings */}
          <div className="demo-ring-outer" />
          <div className="demo-ring-mid" />
          <div className="demo-ring-inner" />

          {/* Profile Photo */}
          <div className="demo-avatar-wrapper">
            <img
              src={caller.photo}
              alt={caller.name}
              className="demo-caller-photo"
              draggable="false"
              onError={(e) => {
                e.target.src = '/default-avatars/1.png';
              }}
            />
          </div>
        </div>

        {/* ── Caller Info ── */}
        <div className="demo-incoming-info">
          <div className="demo-caller-name-row">
            <h2 className="demo-caller-name">{caller.name}</h2>
            {caller.verified !== false && (
              <CheckCircle2 size={20} fill="#0095f6" color="#ffffff" className="demo-verified-icon" />
            )}
          </div>

          {/* Online Status Badge (matches reference image) */}
          <div className="demo-online-badge">
            <span className="demo-online-dot" />
            <span className="demo-online-text">Online</span>
          </div>

          <p className="demo-incoming-status-text">is calling you...</p>

          {/* Pulsing 3 dots */}
          <div className="demo-pulsing-dots" aria-hidden="true">
            <span className="demo-dot dot-1" />
            <span className="demo-dot dot-2" />
            <span className="demo-dot dot-3" />
          </div>
        </div>

        {/* ── Bottom Action Buttons: Decline & Accept ── */}
        <div className="demo-incoming-actions">
          {/* Decline Button */}
          <div className="demo-action-col">
            <button
              type="button"
              className="demo-call-btn demo-decline-btn"
              onClick={onDecline}
              aria-label="Decline call"
            >
              <PhoneOff size={28} color="#ffffff" />
            </button>
            <span className="demo-action-label">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="demo-action-col">
            <button
              type="button"
              className="demo-call-btn demo-accept-btn"
              onClick={onAccept}
              aria-label="Accept call"
            >
              <Video size={28} color="#ffffff" />
            </button>
            <span className="demo-action-label">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
