import { useMemo, useState } from 'react';
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

function randomRoomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildUrl(params: { room?: string | null; role?: Role | null; mode?: Mode | null }) {
  const url = new URL(window.location.href);  
  if (params.room === null) { url.searchParams.delete('room'); }
  else if (params.room) { url.searchParams.set('room', params.room); }
  if (params.role === null) { url.searchParams.delete('role'); }
  else if (params.role) { url.searchParams.set('role', params.role); }
  if (params.mode === null) { url.searchParams.delete('mode'); }
  else if (params.mode) { url.searchParams.set('mode', params.mode); }
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return { room: null as string | null, role: null as Role | null, mode: null as Mode | null };
    const url = new URL(window.location.href);
    const roomParam = url.searchParams.get('room');
    const roleParam = url.searchParams.get('role');
    const modeParam = url.searchParams.get('mode');
    const role = roleParam === 'cohost' || roleParam === 'viewer' || roleParam === 'host' ? (roleParam as Role) : null;
    const mode = modeParam === 'live' || modeParam === 'webinar' || modeParam === 'conference' ? (modeParam as Mode) : null;
    return { room: roomParam, role, mode };
  }, []);

  const initialRoom = useMemo(() => {
    return urlParams.room ?? randomRoomId();
  }, [urlParams.room]);

  const initialRole = useMemo(() => {
    return urlParams.role ?? 'host';
  }, [urlParams.role]);

  const storedSession = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('livekit-session');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionInfo;
    } catch {
      return null;
    }
  }, []);

const [forcedMode, setForcedMode] = useState<Mode | undefined>(
  () => urlParams.mode ?? undefined
);
  const [preservedRole, setPreservedRole] = useState<Role | undefined>(() =>
    urlParams.role ?? undefined,
  );

const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(() => {
  if (storedSession) {
    // Only restore session if URL params match (or aren't present)
    const roomMatches = !urlParams.room || urlParams.room === storedSession.room;
    const roleMatches = !urlParams.role || urlParams.role === storedSession.role;
    const modeMatches = !urlParams.mode || urlParams.mode === storedSession.mode;
    if (roomMatches && roleMatches && modeMatches) {
      return storedSession; // ← stays in call on refresh
    }
    return null; // URL params conflict (e.g. someone shared a different room link)
  }
  return null;
});

  const [role, setRole] = useState<Role>(storedSession?.role ?? initialRole);

  const handleJoin = ({
    identity,
    role: requestedRole,
    mode,
    cameraOn,
  }: {
    identity: string;
    role: Role;
    mode: Mode;
    cameraOn: boolean;
  }) => {
    const room = initialRoom;
    const role = requestedRole;
    const newSession: SessionInfo = { identity, room, role, mode, cameraOn };
    window.localStorage.setItem('livekit-session', JSON.stringify(newSession));
    setSessionInfo(newSession);
    setRole(role);
    setPreservedRole(role);
    buildUrl(newSession);
  };

  const handleLeave = () => {
    window.localStorage.removeItem('livekit-session');
    setSessionInfo(null);

    setForcedMode(undefined);
    buildUrl({ room: null, role: null, mode: null });
  };

  if (!sessionInfo) {
    return (
      <JoinScreen
        onJoin={handleJoin}
        defaultIdentity={''}
        defaultRole={preservedRole ?? role}
        defaultCameraOn={storedSession?.cameraOn ?? false}
        forcedMode={forcedMode}
        defaultMode={forcedMode}  
        forcedRole={preservedRole}
      />
    );
  }

  return (
    <RoomView
      identity={sessionInfo.identity ?? ''}
      room={sessionInfo.room ?? initialRoom}
      role={role}
      mode={sessionInfo.mode}
      cameraOn={sessionInfo.cameraOn}
      onLeave={handleLeave}
      tokenServerUrl={(import.meta.env.VITE_TOKEN_SERVER_URL as string) ?? 'http://localhost:3001/get-token'}
      onRole={setRole}
    />
  );
}
