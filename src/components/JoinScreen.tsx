import { useState } from 'react';
import type { Mode, Role } from './types';
import { ModeCardSelector } from './ModeCardSelector';

export type JoinProps = {
  onJoin: (opts: { identity: string; role: Role; mode: Mode; cameraOn: boolean }) => void;
  defaultIdentity?: string;
  defaultRole?: Role;
  defaultMode?: Mode;
  defaultCameraOn?: boolean;
  forcedMode?: Mode;
  forcedRole?: Role;
};


export function JoinScreen({
  onJoin,
  defaultIdentity = '',
  defaultRole = 'host',
  defaultMode,
  defaultCameraOn = false,
  forcedMode,
  forcedRole,
}: JoinProps) {
  const [identity, setIdentity] = useState(defaultIdentity);
  const [selectedMode, setSelectedMode] = useState<Mode | undefined>(
    forcedMode ?? defaultMode ?? undefined
  );
  const [selectedCameraOn, setSelectedCameraOn] = useState(defaultCameraOn);
  const canJoin = identity.trim().length > 0 && !!selectedMode;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        padding: 16,
      }}
    >
      <div style={{ width: '100%', maxWidth: 1100, padding: '0 12px' }}>
        <div style={{ marginBottom: 18 }}>
          <ModeCardSelector
            forcedMode={forcedMode}
            defaultMode={defaultMode}
            defaultCameraOn={defaultCameraOn}
            onChange={({ mode, cameraOn }) => {
              setSelectedMode(mode);
              setSelectedCameraOn(cameraOn);
            }}
          />
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
            padding: 26,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>LiveKit Webinar</h1>
          <p style={{ margin: '10px 0 22px', color: '#4b5563', fontSize: 15 }}>
            Choose a mode, enter your name, and toggle your camera before joining.
          </p>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Your Name
          <input
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%',
              padding: 10,
              marginTop: 6,
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 15,
            }}
          />
        </label>

        <div style={{ marginBottom: 16, fontSize: 13, color: '#4b5563' }}>
          Joining as{' '}
          <strong>
            {(forcedRole ?? defaultRole) === 'host'
              ? 'Host'
              : (forcedRole ?? defaultRole) === 'cohost'
              ? 'Co-host'
              : 'Viewer'}
          </strong>{' '}
          in a <strong>{selectedMode === 'live' ? 'Live streaming' : selectedMode === 'conference' ? 'Conference' : 'Webinar'}</strong>.
        </div>

        <p style={{ fontSize: 12, color: '#6b7280' }}>
          A room ID will be generated automatically. The role and room ID are stored in the URL so you can share the link with others.
        </p>

        <button
          type="button"
          disabled={!canJoin}
          onClick={() => {
            if (!selectedMode) return;
            onJoin({
              identity: identity.trim(),
              role: forcedRole ?? defaultRole,
              mode: selectedMode,
              cameraOn: selectedCameraOn,
            });
          }}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 10,
            border: 'none',
            background: canJoin ? '#3b82f6' : '#9ca3af',
            color: '#fff',
            fontWeight: 600,
            cursor: canJoin ? 'pointer' : 'not-allowed',
          }}
        >
          Join
        </button>
      </div>
    </div>
    </div>
  );
}
