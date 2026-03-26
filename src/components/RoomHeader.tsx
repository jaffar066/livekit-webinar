import { type Mode, type Role } from './types';
import logo from '../assets/image.png';

export type RoomHeaderProps = {
  mode: Mode;
  role: Role;
  participants: number;
  remoteCount: number;
};

export function RoomHeader({ mode, role, participants, remoteCount }: RoomHeaderProps) {
  const roleLabel = role === 'host' ? 'Host' : role === 'cohost' ? 'Co-host' : 'Viewer';
  const modeLabel =
    mode === 'live' ? 'Live streaming' : mode === 'conference' ? 'Conference' : 'Webinar';

  return (
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
      {/* Left: logo/image */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 56 }}>
        <img src={logo} alt="logo" style={{ width: 70, height: 60, objectFit: 'contain', borderRadius: 8 }} />
      </div>

      {/* Center: title */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 20, color: '#fff', fontWeight: 600 }}>
            {modeLabel} • {roleLabel}
          </div>
        </div>
      </div>

      {/* Right: participants */}
      <div style={{ minWidth: 180, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          Participants: {participants} (others: {remoteCount})
        </div>
      </div>
    </header>
  );
}
