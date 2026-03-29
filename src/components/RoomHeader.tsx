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

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

export function RoomHeader({ mode, role, participants }: RoomHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [systemTime, setSystemTime] = useState(new Date());
  const isMobile = useIsMobile();

  const allParticipants = useParticipants() || [];
  const { localParticipant } = useLocalParticipant() || {};

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

  const formatSystemTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <>
      <header
        style={{
          height: isMobile ? '52px' : '64px',
          padding: isMobile ? '0 12px' : '0 24px',
          background: '#111111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          // Prevent overflow on mobile
          overflow: 'hidden',
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img
            src={logo}
            alt="ALTEGON"
            style={{ height: isMobile ? '24px' : '32px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Center: Status info — on mobile show only status dot + label + timer (no system time) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '24px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500',
            flex: 1,
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          {/* Hide system time on mobile to save space */}
          {!isMobile && (
            <>
              <span>{formatSystemTime(systemTime)}</span>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            </>
          )}

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', flexShrink: 0 }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}99`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: '700' }}>{statusLabel}</span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTimer(sessionSeconds)}</span>
        </div>

        {/* Right: Participants button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: isMobile ? '5px 10px' : '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <circle cx="6" cy="5" r="2.5" strokeWidth="1.4" />
              <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {/* On mobile, show just the count to save width */}
            {isMobile ? participants : `${participants} participant${participants !== 1 ? 's' : ''}`}
          </button>
        </div>
      </header>

      {/* Participant Modal — full-width bottom sheet on mobile, dropdown on desktop */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 100,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'flex-start',
            justifyContent: isMobile ? 'stretch' : 'flex-end',
            padding: isMobile ? '0' : '64px 20px 0',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: isMobile ? '16px 16px 0 0' : 12,
              width: isMobile ? '100%' : 300,
              maxHeight: isMobile ? '70vh' : '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
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
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Participant list */}
            <div style={{ overflowY: 'auto', padding: 8 }}>
              {allParticipants.map((p) => {
                const isLocal = p.identity === localParticipant?.identity;
                const participantRole = isLocal
                  ? (role ?? 'unknown')
                  : getRoleFromMetadata(p.metadata);
                const colors = ROLE_COLORS[participantRole] ?? ROLE_COLORS.unknown;
                const roleDisplay =
                  participantRole === 'cohost'
                    ? 'Co-host'
                    : participantRole === 'host'
                    ? 'Host'
                    : participantRole === 'viewer'
                    ? 'Viewer'
                    : 'Participant';

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
                        color: colors.text,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(p.identity)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name || p.identity}
                        {isLocal && (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            {' '}(you)
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                        {roleDisplay}
                      </div>
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
