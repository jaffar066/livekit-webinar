import { useState } from 'react';
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
  const allParticipants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const roleLabel = role === 'host' ? 'Host' : role === 'cohost' ? 'Co-host' : 'Viewer';
  const modeLabel =
    mode === 'live' ? 'Live streaming' : mode === 'conference' ? 'Conference' : 'Webinar';

  return (
    <>
      <header
        style={{
          padding: '14px 20px',
          background: '#1a1a1a',
          boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 56 }}>
          <img src={logo} alt="logo" style={{ width: 70, height: 60, objectFit: 'contain', borderRadius: 8 }} />
        </div>

        {/* Center: title */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, color: '#fff', fontWeight: 600 }}>
            {modeLabel} • {roleLabel}
          </div>
        </div>

        {/* Right: participants button */}
        <div style={{ minWidth: 180, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)',
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M14.5 13c0-1.933-1.12-3.5-2.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {participants} participant{participants !== 1 ? 's' : ''}
          </button>
        </div>
      </header>

      {/* Modal overlay */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: '70px 20px 0',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              width: 300,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>
                Participants ({participants})
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 18,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Participant list */}
            <div style={{ overflowY: 'auto', padding: 8 }}>
              {allParticipants.map((p) => {
                const isLocal = p.identity === localParticipant?.identity;
                const participantRole = isLocal ? (role ?? 'unknown') : getRoleFromMetadata(p.metadata);
                const colors = ROLE_COLORS[participantRole] ?? ROLE_COLORS.unknown;
                const initials = getInitials(p.identity);
                const displayName = p.name || p.identity;
                const roleDisplay =
                  participantRole === 'cohost' ? 'Co-host' :
                  participantRole === 'host'   ? 'Host' :
                  participantRole === 'viewer' ? 'Viewer' : 'Participant';

                return (
                  <div
                    key={p.identity}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 8px',
                      borderRadius: 8,
                      background: isLocal ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 500,
                        color: colors.text,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Name + role */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayName}
                        {isLocal && (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}> (you)</span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{roleDisplay}</div>
                    </div>

                    {/* Role badge */}
                    <span
                      style={{
                        background: colors.badge,
                        color: colors.badgeText,
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 20,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {roleDisplay}
                    </span>
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