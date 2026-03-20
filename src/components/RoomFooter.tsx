import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { FiCopy, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiShare2, FiPower } from 'react-icons/fi';
import { type Mode, type Role } from './types';

export type RoomFooterProps = {
  room: string;
  role: Role;
  mode: Mode;
  onLeave: () => void;
};

const buttonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.2)',
  background: '#fff',
  cursor: 'pointer',
};

export function RoomFooter({ room, role, mode, onLeave }: RoomFooterProps) {
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
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
      } catch (err) {
        console.error('Failed to copy link', err);
        showToast('Failed to copy link');
      }
    },
    [buildLink, showToast]
  );

  const toggleMicrophone = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error('Failed to toggle microphone', err);
      showToast('Failed to toggle mic');
    }
  }, [localParticipant, isMicrophoneEnabled, showToast]);

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error('Failed to toggle camera', err);
      showToast('Failed to toggle camera');
    }
  }, [localParticipant, isCameraEnabled, showToast]);

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (err) {
      console.error('Failed to toggle screen share', err);
      showToast('Failed to toggle screen share');
    }
  }, [localParticipant, isScreenShareEnabled, showToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  return (
    <footer
      style={{
        position: 'sticky',
        bottom: 0,
        padding: 12,
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        background: 'rgba(37, 36, 36, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {role === 'host' && (
          <>
            {(mode === 'webinar' || mode === 'conference') && (
              <button
                type="button"
                onClick={() => copyLink('cohost')}
                style={buttonStyle}
              >
                <FiCopy style={{ marginRight: 6 }} />
                Co-host link
              </button>
            )}
            {(mode === 'webinar' || mode === 'live') && (
              <button
                type="button"
                onClick={() => copyLink('viewer')}
                style={buttonStyle}
              >
                <FiCopy style={{ marginRight: 6 }} />
                Viewer link
              </button>
            )}
          </>
        )}

        {(role === 'host' || role === 'cohost') && (
          <>
            <button
              type="button"
              onClick={toggleMicrophone}
              style={buttonStyle}
            >
              {isMicrophoneEnabled ? (
                <>
                  <FiMic style={{ marginRight: 6 }} />
                  Mute
                </>
              ) : (
                <>
                  <FiMicOff style={{ marginRight: 6 }} />
                  Unmute
                </>
              )}
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              style={buttonStyle}
            >
              {isCameraEnabled ? (
                <>
                  <FiVideoOff style={{ marginRight: 6 }} />
                  Cam off
                </>
              ) : (
                <>
                  <FiVideo style={{ marginRight: 6 }} />
                  Cam on
                </>
              )}
            </button>
            <button
              type="button"
              onClick={toggleScreenShare}
              style={buttonStyle}
            >
              {isScreenShareEnabled ? (
                <>
                  <FiMonitor style={{ marginRight: 6 }} />
                  Stop share
                </>
              ) : (
                <>
                  <FiShare2 style={{ marginRight: 6 }} />
                  Share screen
                </>
              )}
            </button>
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onLeave}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.2)',
            background: '#df3737',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FiPower />
          End call
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 20,
            transform: 'translateX(-50%)',
            padding: '10px 14px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: 8,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      )}
    </footer>
  );
}
