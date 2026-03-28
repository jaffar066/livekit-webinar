import { useEffect, useState } from 'react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { type Mode, type Role } from './types';
import logo from '../assets/image.png';

export type RoomHeaderProps = {
  mode: Mode;
  role: Role;
  participants: number;
  remoteCount: number;
};

function getInitials(name: string) {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getRoleFromMetadata(metadata?: string): Role | 'unknown' {
  try {
    if (!metadata) return 'unknown';
    const parsed = JSON.parse(metadata);
    return parsed?.role ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

const ROLE_COLORS: Record<string, { bg: string; text: string; badge: string; badgeText: string }> = {
  host:    { bg: '#534AB7', text: '#EEEDFE', badge: '#3C3489', badgeText: '#CECBF6' },
  cohost:  { bg: '#0F6E56', text: '#E1F5EE', badge: '#085041', badgeText: '#9FE1CB' },
  viewer:  { bg: '#5F5E5A', text: '#F1EFE8', badge: '#444441', badgeText: '#D3D1C7' },
  unknown: { bg: '#5F5E5A', text: '#F1EFE8', badge: '#444441', badgeText: '#D3D1C7' },
};

export function RoomHeader({ mode, role, participants }: RoomHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [systemTime, setSystemTime] = useState(new Date());
  
  // Safe hook access: prevents crash when outside LiveKitRoom provider
  const allParticipants = useParticipants() || []; 
  const { localParticipant } = useLocalParticipant() || {};

  // Dynamic Label Logic based on Mode
  const statusLabel = mode === 'live' ? 'Live' : mode === 'webinar' ? 'Webinar' : 'Conference';
  const statusColor = mode === 'live' ? '#00ffaa' : mode === 'webinar' ? '#534AB7' : '#0F6E56';

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const formatSystemTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <>
      <header
        style={{
          height: '64px',
          padding: '0 24px',
          background: '#111111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left: ALTEGON Branding (Name removed as per requirement) */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '240px' }}>
          <img src={logo} alt="ALTEGON" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Center: System Time | Dynamic Status | Timer */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px', 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span>{formatSystemTime(systemTime)}</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: statusColor, 
              boxShadow: `0 0 10px ${statusColor}66` 
            }} />
            <span style={{ fontWeight: '700' }}>{statusLabel}</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span>{formatTimer(sessionSeconds)}</span>
        </div>

        {/* Right: Participant Count Button */}
        <div style={{ minWidth: '240px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <circle cx="6" cy="5" r="2.5" strokeWidth="1.4" />
              <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {participants} participant{participants !== 1 ? 's' : ''}
          </button>
        </div>
      </header>

      {/* Participant Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '70px 20px 0',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12,
              width: 300, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>Participants ({participants})</span>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: 8 }}>
              {allParticipants.map((p) => {
                const isLocal = p.identity === localParticipant?.identity;
                const participantRole = isLocal ? (role ?? 'unknown') : getRoleFromMetadata(p.metadata);
                const colors = ROLE_COLORS[participantRole] ?? ROLE_COLORS.unknown;
                const roleDisplay = participantRole === 'cohost' ? 'Co-host' : participantRole === 'host' ? 'Host' : participantRole === 'viewer' ? 'Viewer' : 'Participant';
                return (
                  <div key={p.identity} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, background: isLocal ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.text }}>{getInitials(p.identity)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || p.identity}{isLocal && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}> (you)</span>}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{roleDisplay}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}