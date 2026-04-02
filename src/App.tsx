import { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import '@livekit/components-styles';
import { JoinScreen } from './components/JoinScreen';
import { RoomView } from '../src/components/RoomView';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { DashboardLayout } from './components/DashboardLayout';
import RecordingsPage from './components/RecordingsPage';

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
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (params.room === null) url.searchParams.delete('room');
  else if (params.room) url.searchParams.set('room', params.room);
  if (params.role === null) url.searchParams.delete('role');
  else if (params.role) url.searchParams.set('role', params.role);
  if (params.mode === null) url.searchParams.delete('mode');
  else if (params.mode) url.searchParams.set('mode', params.mode);
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState<object | null>(() => {
    try {
      const raw = localStorage.getItem('userData');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return { room: null, role: null, mode: null };
    const url = new URL(window.location.href);
    const room = url.searchParams.get('room');
    const roleParam = url.searchParams.get('role');
    const modeParam = url.searchParams.get('mode');
    const role = (roleParam === 'cohost' || roleParam === 'viewer' || roleParam === 'host') ? (roleParam as Role) : null;
    const mode = (modeParam === 'live' || modeParam === 'webinar' || modeParam === 'conference') ? (modeParam as Mode) : null;
    return { room, role, mode };
  }, []);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem('livekit-session');
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw) as SessionInfo;
      if (urlParams.room && stored.room === urlParams.room) return stored;
      return null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState<Role>(() => sessionInfo?.role ?? urlParams.role ?? 'host');

  const handleAuth = (user: object) => {
    localStorage.setItem('userData', JSON.stringify(user));
    setAuthUser(user);
    navigate('/join');
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setAuthUser(null);
    navigate('/auth');
  };

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
    const room = urlParams.room ?? randomRoomId();
    const newSession: SessionInfo = { identity, room, role: requestedRole, mode, cameraOn };
    window.sessionStorage.setItem('livekit-session', JSON.stringify(newSession));
    setSessionInfo(newSession);
    setRole(requestedRole);
    buildUrl(newSession);
    navigate('/room');
  };

  const handleLeave = () => {
    window.sessionStorage.removeItem('livekit-session');
    setSessionInfo(null);
    buildUrl({ room: null, role: null, mode: null });
    navigate('/join');
  };

  const HomeDashboard = (
    <DashboardLayout user={authUser} onLogout={handleLogout}>
      <JoinScreen
        onJoin={handleJoin}
        defaultIdentity={''}
        defaultRole={urlParams.role ?? 'host'}
        defaultCameraOn={false}
        forcedMode={urlParams.mode ?? undefined}
        defaultMode={urlParams.mode ?? undefined}
        forcedRole={urlParams.role ?? undefined}
      />
    </DashboardLayout>
  );

  const RecordingsDashboard = (
    <DashboardLayout user={authUser} onLogout={handleLogout}>
      <div className="dash-recordings-wrap">
        <RecordingsPage />
      </div>
    </DashboardLayout>
  );

  const RoomPage = sessionInfo ? (
    <RoomView
      identity={sessionInfo.identity}
      room={sessionInfo.room}
      role={role}
      mode={sessionInfo.mode}
      cameraOn={sessionInfo.cameraOn}
      onLeave={handleLeave}
      tokenServerUrl={(import.meta.env.VITE_TOKEN_SERVER_URL as string) ?? 'http://localhost:3001/get-token'}
      onRole={setRole}
    />
  ) : null;

  return (
    <Routes>
      <Route path="/auth" element={authUser ? <Navigate to="/home" replace /> : <Login onLogin={handleAuth} onGoSignUp={() => navigate('/signup')} />} />
      <Route path="/signup" element={authUser ? <Navigate to="/home" replace /> : <SignUp onSignUp={handleAuth} onGoLogin={() => navigate('/auth')} />} />
      <Route path="/room" element={authUser ? (RoomPage ?? <Navigate to="/home" replace />) : <Navigate to="/auth" replace />} />
      <Route path="/home" element={authUser ? HomeDashboard : <Navigate to="/auth" replace />} />
      <Route path="/recordings" element={authUser ? RecordingsDashboard : <Navigate to="/auth" replace />} />
      <Route path="/" element={<Navigate to={authUser ? '/home' : '/auth'} replace />} />
      <Route path="*" element={<Navigate to={authUser ? '/home' : '/auth'} replace />} />
    </Routes>
  );
}