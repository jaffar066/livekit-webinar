import { type Mode, type Role } from './types';

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
        padding: 12,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 24, color: 'rgba(0,0,0,0.7)' }}>
          {modeLabel} • {roleLabel}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>
          Participants: {participants} (others: {remoteCount})
        </div>
      </div>
    </header>
  );
}
