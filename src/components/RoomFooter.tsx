import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocalParticipant, useRoomContext, useRemoteParticipants } from '@livekit/components-react';
import {
  FiCopy, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor,
  FiPower, FiMessageSquare, FiMoreHorizontal, FiX, FiChevronUp, FiCheck,
} from 'react-icons/fi';
import { Room, RoomEvent, Track } from 'livekit-client';
import { type Mode, type Role } from './types';

export type RoomFooterProps = {
  roomName: string;
  role: Role;
  mode: Mode;
  onLeave: () => void;
  onToggleChat?: () => void;
  chatVisible?: boolean;
  unreadCount?: number;
  otherIsSharing?: boolean;
};

// ─── Styles ────────────────────────────────────────────────────
const btn: CSSProperties = {
  height: 44, border: 'none', borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 20, cursor: 'pointer', color: '#fff', position: 'relative',
};

const copyBtn: CSSProperties = {
  ...btn, width: 'auto', padding: '0 16px', gap: 8, fontSize: 14, fontWeight: 500,
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
};

// ─── Small helpers ─────────────────────────────────────────────
function SpeakerOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [bp]);
  return mobile;
}

function useActiveDevice(kind: MediaDeviceKind) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(ds => setId(ds.find(d => d.kind === kind)?.deviceId ?? null))
      .catch(() => {});
  }, [kind]);
  return [id, setId] as const;
}

// ─── DeviceMenu ────────────────────────────────────────────────
function DeviceMenu({ title, devices, activeId, onSelect, onClose, anchor }: {
  title: string;
  devices: MediaDeviceInfo[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  anchor: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    if (anchor.current) {
      const r = anchor.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - r.top + 8, left: r.left + r.width / 2 });
    }
  }, [anchor]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !anchor.current?.contains(e.target as Node))
        onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchor]);

  return (
    <div ref={ref} style={{
      position: 'fixed', bottom: pos.bottom, left: pos.left, transform: 'translateX(-50%)',
      background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12, padding: '6px 0', minWidth: 230, zIndex: 1000,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      {devices.length === 0
        ? <div style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No devices found</div>
        : devices.map(d => (
          <button key={d.deviceId} onClick={() => { onSelect(d.deviceId); onClose(); }}
            style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ width: 18, display: 'flex', alignItems: 'center' }}>
              {d.deviceId === activeId && <FiCheck size={14} color="#63b3ed" />}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label || `Device ${d.deviceId.slice(0, 8)}`}
            </span>
          </button>
        ))
      }
    </div>
  );
}

// ─── SplitButton ───────────────────────────────────────────────
function SplitButton({ icon, isOn, onColor = '#dc2626', offColor = '#333', onMain, onChevron, open, menu, anchor }: {
  icon: React.ReactNode;
  isOn: boolean;
  onColor?: string;   // color when isOn=false (danger/red)
  offColor?: string;  // color when isOn=true  (normal/dark)
  onMain: () => void;
  onChevron: () => void;
  open: boolean;
  menu: React.ReactNode;
  anchor: React.RefObject<HTMLDivElement | null>;
}) {
  const bg = isOn ? offColor : onColor;
  return (
    <div ref={anchor} style={{ display: 'flex', borderRadius: 12, position: 'relative' }}>
      <button onClick={onMain} style={{ ...btn, width: 44, background: bg, borderRadius: '12px 0 0 12px', borderRight: '1px solid rgba(255,255,255,0.12)' }}>
        {icon}
      </button>
      <button onClick={onChevron} style={{ ...btn, width: 22, background: bg, borderRadius: '0 12px 12px 0' }}>
        <FiChevronUp size={11} strokeWidth={3} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && menu}
    </div>
  );
}

// ─── RoomFooter ────────────────────────────────────────────────
export function RoomFooter({ roomName, role, mode, onLeave, onToggleChat, chatVisible, unreadCount = 0, otherIsSharing = false }: RoomFooterProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const isMobile = useIsMobile();

  // Device lists
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeMicId, setActiveMicId] = useActiveDevice('audioinput');
  const [activeCamId, setActiveCamId] = useActiveDevice('videoinput');
  const [activeSpeakerId, setActiveSpeakerId] = useActiveDevice('audiooutput');

  // Menu open states
  const [openMenu, setOpenMenu] = useState<'mic' | 'cam' | 'speaker' | null>(null);
  const micRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const speakerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [dotsOpen, setDotsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Load all devices
const loadDevices = useCallback(async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const all = await navigator.mediaDevices.enumerateDevices();
    setMicDevices(all.filter(d => d.kind === 'audioinput'));
    setCamDevices(all.filter(d => d.kind === 'videoinput'));
    setSpeakerDevices(all.filter(d => d.kind === 'audiooutput'));
  } catch (err) {
    console.error('Device load failed:', err);
  }
}, []);
  
useEffect(() => {
  loadDevices();
}, []);

  // Bluetooth auto-switch on device change
  useEffect(() => {
    const handle = async () => {
      await loadDevices();
      const inputs = await Room.getLocalDevices('audioinput');
      const bt = inputs.find(d => /bluetooth|hands-free/i.test(d.label));
      if (!bt) return;
      await room.switchActiveDevice('audioinput', bt.deviceId);
      setActiveMicId(bt.deviceId);
      const outputs = await Room.getLocalDevices('audiooutput');
      const btOut = outputs.find(d => /bluetooth/i.test(d.label));
      if (btOut) { await room.switchActiveDevice('audiooutput', btOut.deviceId); setActiveSpeakerId(btOut.deviceId); }
      showToast('Bluetooth connected');
    };
    room.on(RoomEvent.MediaDevicesChanged, handle);
    return () => { room.off(RoomEvent.MediaDevicesChanged, handle); };
  }, [room, loadDevices, setActiveMicId, setActiveSpeakerId, showToast]);

  // Speaker mute: disable all remote audio tracks locally
  const applyMute = useCallback((muted: boolean) => {
    remoteParticipants.forEach(p => {
      [Track.Source.Microphone, Track.Source.ScreenShareAudio].forEach(src => {
        const track = p.getTrackPublication(src)?.audioTrack;
        if (track) track.mediaStreamTrack.enabled = !muted;
      });
    });
  }, [remoteParticipants]);

  const toggleSpeaker = useCallback(() => {
    const next = !isSpeakerMuted;
    setIsSpeakerMuted(next);
    applyMute(next);
    showToast(next ? 'Speaker muted' : 'Speaker unmuted');
  }, [isSpeakerMuted, applyMute, showToast]);

  // Re-apply mute when a new participant joins
  useEffect(() => { if (isSpeakerMuted) applyMute(true); }, [remoteParticipants, isSpeakerMuted, applyMute]);

  // Toggle helpers
  const toggle = useCallback(async (action: () => Promise<unknown>, errMsg: string) => {
    try { await action(); } catch { showToast(errMsg); }
  }, [showToast]);

  const switchDevice = useCallback(async (kind: 'audioinput' | 'videoinput' | 'audiooutput', deviceId: string, setter: (id: string) => void, label: string) => {
    try { await room.switchActiveDevice(kind, deviceId); setter(deviceId); showToast(label); }
    catch { showToast(`Failed to switch ${label.toLowerCase()}`); }
  }, [room, showToast]);

  const buildLink = useCallback((r: Role) => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomName);
    url.searchParams.set('role', r);
    return url.toString();
  }, [roomName]);

  const copyLink = useCallback(async (r: Role) => {
    try { await navigator.clipboard.writeText(buildLink(r)); showToast(`Copied ${r} link`); }
    catch { showToast('Failed to copy'); }
  }, [buildLink, showToast]);

  const isHostOrCohost = role === 'host' || role === 'cohost';

  // ─── Split buttons (defined once, used in both layouts) ────────
  const micBtn = (
    <SplitButton
      anchor={micRef} icon={isMicrophoneEnabled ? <FiMic /> : <FiMicOff />}
      isOn={isMicrophoneEnabled}
      onMain={() => toggle(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled), 'Failed to toggle mic')}
      onChevron={() => setOpenMenu(v => v === 'mic' ? null : 'mic')}
      open={openMenu === 'mic'}
      menu={<DeviceMenu title="Microphone" devices={micDevices} activeId={activeMicId} onSelect={id => switchDevice('audioinput', id, setActiveMicId, 'Microphone')} onClose={() => setOpenMenu(null)} anchor={micRef} />}
    />
  );

  const camBtn = (
    <SplitButton
      anchor={camRef} icon={isCameraEnabled ? <FiVideo /> : <FiVideoOff />}
      isOn={isCameraEnabled}
      onMain={() => toggle(() => localParticipant.setCameraEnabled(!isCameraEnabled), 'Failed to toggle camera')}
      onChevron={() => setOpenMenu(v => v === 'cam' ? null : 'cam')}
      open={openMenu === 'cam'}
      menu={<DeviceMenu title="Camera" devices={camDevices} activeId={activeCamId} onSelect={id => switchDevice('videoinput', id, setActiveCamId, 'Camera')} onClose={() => setOpenMenu(null)} anchor={camRef} />}
    />
  );

  const speakerBtn = (
    <SplitButton
      anchor={speakerRef} icon={isSpeakerMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
      isOn={!isSpeakerMuted}   // isOn=true → unmuted (dark bg), isOn=false → muted (red bg)
      onMain={toggleSpeaker}
      onChevron={() => setOpenMenu(v => v === 'speaker' ? null : 'speaker')}
      open={openMenu === 'speaker'}
      menu={<DeviceMenu title="Speaker" devices={speakerDevices} activeId={activeSpeakerId} onSelect={id => switchDevice('audiooutput', id, setActiveSpeakerId, 'Speaker')} onClose={() => setOpenMenu(null)} anchor={speakerRef} />}
    />
  );

  const footerStyle: CSSProperties = {
    position: 'sticky', bottom: 0, zIndex: 10,
    borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: isMobile ? '10px 16px' : '12px 24px',
    gap: isMobile ? 10 : 12,
  };

  // ─── Mobile ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <footer style={footerStyle}>
          {isHostOrCohost && <>{micBtn}{camBtn}</>}
          {speakerBtn}
          <button onClick={onLeave} style={{ ...btn, width: 44, background: '#df3737' }}><FiPower /></button>
          <button onClick={() => setDotsOpen(true)} style={{ ...btn, width: 44, background: '#333' }}>
            <FiMoreHorizontal />
            {unreadCount > 0 && !chatVisible && <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, background: '#dc2626', borderRadius: '50%' }} />}
          </button>
        </footer>

        {dotsOpen && (
          <div onClick={() => setDotsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#1e1e1e', borderRadius: '16px 16px 0 0', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>More options</span>
                <FiX onClick={() => setDotsOpen(false)} style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }} />
              </div>
              <ModalBtn icon={<FiMessageSquare />} label="Chat" active={chatVisible} onClick={() => { onToggleChat?.(); setDotsOpen(false); }} />
              {role === 'host' && <>
                <ModalBtn icon={<FiCopy />} label="Copy co-host link" onClick={() => { copyLink('cohost'); setDotsOpen(false); }} />
                <ModalBtn icon={<FiCopy />} label="Copy viewer link"  onClick={() => { copyLink('viewer');  setDotsOpen(false); }} />
              </>}
            </div>
          </div>
        )}
        {toast && <Toast msg={toast} />}
      </>
    );
  }

  // ─── Web ───────────────────────────────────────────────────────
  return (
    <footer style={footerStyle}>
      {role === 'host' && <>
        {(mode === 'webinar' || mode === 'conference') && <button onClick={() => copyLink('cohost')} style={copyBtn}><FiCopy /> Co-host</button>}
        {(mode === 'webinar' || mode === 'live')       && <button onClick={() => copyLink('viewer')} style={copyBtn}><FiCopy /> Viewer</button>}
      </>}

      {isHostOrCohost && <>{micBtn}{camBtn}</>}
      {speakerBtn}

      {isHostOrCohost && (
        <button
          onClick={() => toggle(() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled), 'Failed to toggle screen share')}
          disabled={otherIsSharing && !isScreenShareEnabled}
          style={{ ...btn, width: 44, background: isScreenShareEnabled ? '#63b3ed' : '#333', opacity: otherIsSharing && !isScreenShareEnabled ? 0.5 : 1 }}
        >
          <FiMonitor />
        </button>
      )}

      <button onClick={() => onToggleChat?.()} style={{ ...btn, width: 44, background: chatVisible ? 'rgba(99,179,237,0.2)' : '#333' }}>
        <FiMessageSquare />
        {unreadCount > 0 && !chatVisible && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
            {unreadCount}
          </div>
        )}
      </button>

      <button onClick={onLeave} style={{ ...btn, width: 44, background: '#df3737' }}><FiPower /></button>

      {toast && <Toast msg={toast} />}
    </footer>
  );
}

// ─── Tiny helpers ──────────────────────────────────────────────
function ModalBtn({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', background: active ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500 }}>
      {icon} {label}
    </button>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 80, transform: 'translateX(-50%)', padding: '10px 14px', background: 'rgba(0,0,0,0.9)', color: '#fff', borderRadius: 8, fontSize: 13, zIndex: 9999 }}>
      {msg}
    </div>
  );
}
