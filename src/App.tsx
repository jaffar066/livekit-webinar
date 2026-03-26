import { useMemo, useState, useEffect } from 'react';
import '@livekit/components-styles';
import { JoinScreen } from './components/JoinScreen';
import { RoomView } from '../src/components/RoomView';

type Role = 'host' | 'cohost' | 'viewer';
type Mode = 'live' | 'webinar' | 'conference';

type SessionInfo = {
  identity: string;
  room: string;
  role: Role;
  mode: Mode;
  cameraOn: boolean;
};

const SS_KEY = 'livekit-active-session';

export default function App() {
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      room: params.get('room'),
      role: params.get('role') as Role,
      mode: params.get('mode') as Mode,
    };
  }, []);

  // 1. Initial state from sessionStorage for Refresh persistence
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(() => {
    const saved = window.sessionStorage.getItem(SS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SessionInfo;
        if (!urlParams.room || parsed.room === urlParams.room) return parsed;
      } catch { return null; }
    }
    return null;
  });

  // 2. Sync URL and storage
  useEffect(() => {
    const url = new URL(window.location.href);
    if (sessionInfo) {
      url.searchParams.set('room', sessionInfo.room);
      url.searchParams.set('role', sessionInfo.role);
      url.searchParams.set('mode', sessionInfo.mode);
      window.sessionStorage.setItem(SS_KEY, JSON.stringify(sessionInfo));
    } else {
      // Ensure a room exists in URL for the Join Card
      if (!url.searchParams.get('room')) {
        url.searchParams.set('room', Math.floor(100000 + Math.random() * 900000).toString());
      }
    }
    window.history.replaceState({}, '', url.toString());
  }, [sessionInfo]);

  const handleJoin = (data: { identity: string; role: Role; mode: Mode; cameraOn: boolean }) => {
    const currentRoom = new URLSearchParams(window.location.search).get('room') || '';
    setSessionInfo({ ...data, room: currentRoom });
  };

  const handleLeave = () => {
    window.sessionStorage.removeItem(SS_KEY);
    setSessionInfo(null);
  };

  if (!sessionInfo) {
    return (
      <JoinScreen
        onJoin={handleJoin}
        // REMOVED defaultIdentity so the input field is always empty on a fresh paste
        defaultIdentity={''} 
        forcedMode={urlParams.mode ?? undefined}
        forcedRole={urlParams.role ?? undefined}
      />
    );
  }

  return (
    <RoomView
      identity={sessionInfo.identity}
      room={sessionInfo.room}
      role={sessionInfo.role}
      mode={sessionInfo.mode}
      cameraOn={sessionInfo.cameraOn}
      onLeave={handleLeave}
      tokenServerUrl={import.meta.env.VITE_TOKEN_SERVER_URL ?? 'http://localhost:3001/get-token'}
      onRole={(newRole) => setSessionInfo(prev => prev ? { ...prev, role: newRole as Role } : null)}
    />
  );
}