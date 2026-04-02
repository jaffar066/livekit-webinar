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
    navigate('/home');
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
    navigate(`/meeting?room=${encodeURIComponent(room)}&role=${requestedRole}&mode=${mode}`);
  };

  const handleLeave = () => {
    window.sessionStorage.removeItem('livekit-session');
    setSessionInfo(null);
    navigate('/home');
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

  const MeetingRouteFallback = () => {
    // If they have sessionInfo, go to meeting. 
    if (sessionInfo) {
      return (
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
      );
    }
    // If they have a room in the URL but no session, show JoinScreen for guests
    if (urlParams.room) {
      return (
        <div className="guest-join-wrapper" style={{ height: '100vh', width: '100vw' }}>
          <JoinScreen
            onJoin={handleJoin}
            defaultIdentity={''}
            defaultRole={urlParams.role ?? 'viewer'}
            defaultCameraOn={false}
            forcedMode={urlParams.mode ?? undefined}
            defaultMode={urlParams.mode ?? undefined}
            forcedRole={urlParams.role ?? undefined}
          />
        </div>
      );
    }
    // Otherwise redirect to home/auth
    return <Navigate to={authUser ? '/home' : '/auth'} replace />;
  };

  return (
    <Routes>
      <Route path="/auth" element={authUser ? <Navigate to="/home" replace /> : <Login onLogin={handleAuth} onGoSignUp={() => navigate('/signup')} />} />
      <Route path="/signup" element={authUser ? <Navigate to="/home" replace /> : <SignUp onSignUp={handleAuth} onGoLogin={() => navigate('/auth')} />} />
      <Route path="/meeting" element={<MeetingRouteFallback />} />
      <Route path="/home" element={authUser ? HomeDashboard : <Navigate to="/auth" replace />} />
      <Route path="/recordings" element={authUser ? RecordingsDashboard : <Navigate to="/auth" replace />} />
      <Route path="/" element={<Navigate to={authUser ? '/home' : '/auth'} replace />} />
      <Route path="*" element={<Navigate to={authUser ? '/home' : '/auth'} replace />} />
    </Routes>
  );
}