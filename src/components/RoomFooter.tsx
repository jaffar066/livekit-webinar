import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { FiCopy, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiShare2, FiPower, FiMessageSquare, FiMoreHorizontal, FiX } from 'react-icons/fi';
import { type Mode, type Role } from './types';

export type RoomFooterProps = {
  room: string;
  role: Role;
  mode: Mode;
  onLeave: () => void;
  onToggleChat?: () => void;
  chatVisible?: boolean;
  unreadCount?: number;
  otherIsSharing?: boolean;
};

// 1. Pill style for Copy buttons (with text)
const copyButtonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: '14px',
  fontWeight: 500,
  height: 44,
};

// 2. Circle style for everything else (No text)
const circleButtonStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  cursor: 'pointer',
  color: '#fff',
  position: 'relative',
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

export function RoomFooter({
  room,
  role,
  mode,
  onLeave,
  onToggleChat,
  chatVisible,
  unreadCount = 0,
  otherIsSharing = false,
}: RoomFooterProps) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [dotsOpen, setDotsOpen] = useState(false);
  const isMobile = useIsMobile();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const buildLink = useCallback(
    (targetRole: Role) => {
      const url = new URL(window.location.href);
      url.searchParams.set('room', room);
      url.searchParams.set('role', targetRole);
      return url.toString();
    },
    [room]
  );

  const copyLink = useCallback(
    async (targetRole: Role) => {
      const link = buildLink(targetRole);
      try {
        await navigator.clipboard.writeText(link);
        showToast(`Copied ${targetRole} link`);
      } catch {
        showToast('Failed to copy link');
      }
    },
    [buildLink, showToast]
  );

  const toggleMicrophone = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      showToast('Failed to toggle mic');
    }
  }, [localParticipant, isMicrophoneEnabled, showToast]);

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch {
      showToast('Failed to toggle camera');
    }
  }, [localParticipant, isCameraEnabled, showToast]);

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch {
      showToast('Failed to toggle screen share');
    }
  }, [localParticipant, isScreenShareEnabled, showToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // ─── Mobile Layout ──────────────────────────────────────────
  if (isMobile) {
    const isHostOrCohost = role === 'host' || role === 'cohost';
    return (
      <>
        <footer style={{
          position: 'sticky', bottom: 0, padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', gap: 12, zIndex: 10,
        }}>
          {isHostOrCohost && (
            <>
              <button onClick={toggleMicrophone} style={{ ...circleButtonStyle, background: isMicrophoneEnabled ? '#333' : '#dc2626' }}>
                {isMicrophoneEnabled ? <FiMic /> : <FiMicOff />}
              </button>
              <button onClick={toggleCamera} style={{ ...circleButtonStyle, background: isCameraEnabled ? '#333' : '#dc2626' }}>
                {isCameraEnabled ? <FiVideo /> : <FiVideoOff />}
              </button>
            </>
          )}
          <button onClick={onLeave} style={{ ...circleButtonStyle, background: '#df3737' }}>
            <FiPower />
          </button>
          <button onClick={() => setDotsOpen(true)} style={{ ...circleButtonStyle, background: '#333' }}>
            <FiMoreHorizontal />
            {unreadCount > 0 && !chatVisible && (
              <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, background: '#dc2626', borderRadius: '50%' }} />
            )}
          </button>
        </footer>

        {dotsOpen && (
          <div onClick={() => setDotsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: '#1e1e1e', borderRadius: '16px 16px 0 0', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>More options</span>
                <FiX onClick={() => setDotsOpen(false)} style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }} />
              </div>
              <ModalButton icon={<FiMessageSquare />} label="Chat" active={chatVisible} onClick={() => { onToggleChat?.(); setDotsOpen(false); }} />
              {role === 'host' && (
                <>
                  <ModalButton icon={<FiCopy />} label="Copy co-host link" onClick={() => { copyLink('cohost'); setDotsOpen(false); }} />
                  <ModalButton icon={<FiCopy />} label="Copy viewer link" onClick={() => { copyLink('viewer'); setDotsOpen(false); }} />
                </>
              )}
            </div>
          </div>
        )}
        {toastMessage && <Toast message={toastMessage} />}
      </>
    );
  }

  // ─── Web Layout (All centered, uniform circles) ──────────────
  return (
    <footer style={{
      position: 'sticky', bottom: 0, padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', gap: 12, zIndex: 10,
    }}>
      {/* 1. Copy Buttons (Left side of the center cluster) */}
      {role === 'host' && (
        <>
          {(mode === 'webinar' || mode === 'conference') && (
            <button onClick={() => copyLink('cohost')} style={copyButtonStyle}><FiCopy /> Co-host</button>
          )}
          {(mode === 'webinar' || mode === 'live') && (
            <button onClick={() => copyLink('viewer')} style={copyButtonStyle}><FiCopy /> Viewer</button>
          )}
        </>
      )}

      {/* 2. Media Buttons (Middle) */}
      {(role === 'host' || role === 'cohost') && (
        <>
          <button onClick={toggleMicrophone} style={{ ...circleButtonStyle, background: isMicrophoneEnabled ? '#333' : '#dc2626' }}>
            {isMicrophoneEnabled ? <FiMic /> : <FiMicOff />}
          </button>
          <button onClick={toggleCamera} style={{ ...circleButtonStyle, background: isCameraEnabled ? '#333' : '#dc2626' }}>
            {isCameraEnabled ? <FiVideo /> : <FiVideoOff />}
          </button>
          <button
            onClick={toggleScreenShare}
            disabled={otherIsSharing && !isScreenShareEnabled}
            style={{ 
              ...circleButtonStyle, 
              background: isScreenShareEnabled ? '#63b3ed' : '#333',
              opacity: otherIsSharing && !isScreenShareEnabled ? 0.5 : 1 
            }}
          >
            <FiMonitor />
          </button>
        </>
      )}

      {/* 3. Actions (Right side of the center cluster) */}
      <button onClick={() => onToggleChat?.()} style={{ ...circleButtonStyle, background: chatVisible ? 'rgba(99,179,237,0.2)' : '#333' }}>
        <FiMessageSquare />
        {unreadCount > 0 && !chatVisible && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
            {unreadCount}
          </div>
        )}
      </button>

      <button onClick={onLeave} style={{ ...circleButtonStyle, background: '#df3737' }}>
        <FiPower />
      </button>

      {toastMessage && <Toast message={toastMessage} />}
    </footer>
  );
}

// ─── Shared sub-components ───────────────────────────────────

function ModalButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; }) {
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', background: active ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500 }}>
      {icon} {label}
    </button>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 80, transform: 'translateX(-50%)', padding: '10px 14px', background: 'rgba(0,0,0,0.9)', color: 'white', borderRadius: 8, fontSize: 13, zIndex: 9999 }}>
      {message}
    </div>
  );
}