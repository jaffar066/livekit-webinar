import { useEffect, useRef, useState } from 'react';
import type { Mode } from './types';
import type { JSX } from 'react/jsx-runtime';

const MODE_CONFIG: Record<
  Mode,
  { title: string; accent: string; glow: string; icon: JSX.Element; description: string }
> = {
  live: {
    title: 'Live Streaming',
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.18)',
    description: 'Broadcast to your audience in real time',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
  },
  webinar: {
    title: 'Webinar',
    accent: '#6366f1',
    glow: 'rgba(99,102,241,0.18)',
    description: 'Host presentations with Q&A for attendees',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  conference: {
    title: 'Conference',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.18)',
    description: 'Collaborate with your team in real-time',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
};

export type ModeCardSelectorProps = {
  forcedMode?: Mode;
  defaultMode?: Mode;
  defaultCameraOn?: boolean;
  onChange?: (selection: { mode?: Mode; cameraOn: boolean; name: string }) => void;
  onJoin?: (selection: { mode: Mode; cameraOn: boolean; name: string }) => void;
};

export function ModeCardSelector({
  forcedMode,
  defaultCameraOn = false,
  onChange,
  onJoin,
}: ModeCardSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<Mode | undefined>(forcedMode ?? undefined);
  const [cameraOnState, setCameraOnState] = useState<Record<Mode, boolean>>(() => ({
    live: defaultCameraOn,
    webinar: defaultCameraOn,
    conference: defaultCameraOn,
  }));
  const [nameState, setNameState] = useState<Record<Mode, string>>({
    live: '',
    webinar: '',
    conference: '',
  });

  const videoRefs = useRef<Record<Mode, HTMLVideoElement | null>>({
    live: null,
    webinar: null,
    conference: null,
  });
  const streamRefs = useRef<Record<Mode, MediaStream | null>>({
    live: null,
    webinar: null,
    conference: null,
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (selectedMode) {
      onChange?.({ mode: selectedMode, cameraOn: cameraOnState[selectedMode], name: nameState[selectedMode] });
    }
  }, [selectedMode, cameraOnState, nameState, onChange]);

  const startCamera = (mode: Mode) => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (streamRefs.current[mode]) {
          streamRefs.current[mode]!.getTracks().forEach((t) => t.stop());
        }
        streamRefs.current[mode] = stream;
        if (videoRefs.current[mode]) {
          videoRefs.current[mode]!.srcObject = stream;
          videoRefs.current[mode]!.play().catch(() => {});
        }
      })
      .catch(() => {
        setCameraOnState((prev) => ({ ...prev, [mode]: false }));
      });
  };

  const stopCamera = (mode: Mode) => {
    if (streamRefs.current[mode]) {
      streamRefs.current[mode]!.getTracks().forEach((t) => t.stop());
      streamRefs.current[mode] = null;
    }
    if (videoRefs.current[mode]) {
      videoRefs.current[mode]!.srcObject = null;
    }
  };

  const handleCameraToggle = (mode: Mode, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !cameraOnState[mode];
    setCameraOnState((prev) => ({ ...prev, [mode]: newVal }));
    if (newVal) startCamera(mode);
    else stopCamera(mode);
  };

  const handleJoin = (mode: Mode, e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.({ mode, cameraOn: cameraOnState[mode], name: nameState[mode] });
  };

  const modes = forcedMode ? [forcedMode] : (['live', 'webinar', 'conference'] as Mode[]);

  return (
    <div className="mcs-wrapper">
      <div className="mcs-header">
        <h1 className="mcs-title">LiveKit Studio</h1>
        <p className="mcs-subtitle">Choose your session type and join instantly</p>
      </div>

      <div className="mcs-grid">
        {modes.map((cardMode) => {
          const config = MODE_CONFIG[cardMode];
          const isSelected = selectedMode === cardMode;
          const isLive = cardMode === 'live';
          const isWebinar = cardMode === 'webinar';
          const isConference = cardMode === 'conference';
          const cameraOn = cameraOnState[cardMode];
          const name = nameState[cardMode];
          const hasName = name.trim().length > 0;

          return (
            <div
              key={cardMode}
              className={`mcs-card${isSelected ? ' mcs-card--selected' : ''}`}
              style={{
                '--card-accent': config.accent,
                '--card-glow': config.glow,
                '--card-accent-light': config.accent + '18',
              } as React.CSSProperties}
              onClick={() => { if (!forcedMode) setSelectedMode(cardMode); }}
            >
              {/* Top accent bar */}
              <div className="mcs-accent-bar" />

              {/* Header row */}
              <div className="mcs-card-header">
                <div className="mcs-icon-badge">
                  {config.icon}
                </div>
                <div className="mcs-title-group">
                  <div className="mcs-card-title">{config.title}</div>
                  <div className="mcs-card-desc">{config.description}</div>
                </div>
                {/* Camera toggle */}
                <div
                  className={`mcs-toggle-track${cameraOn ? ' mcs-toggle-track--on' : ''}`}
                  onClick={(e) => handleCameraToggle(cardMode, e)}
                >
                  <div className="mcs-toggle-thumb" />
                </div>
              </div>

              {/* Camera status label */}
              <div className={`mcs-cam-label${cameraOn ? ' mcs-cam-label--on' : ''}`}>
                <div className="mcs-cam-dot" />
                {cameraOn ? 'Camera on' : 'Camera off'}
              </div>

              {/* Preview area */}
              <div className="mcs-preview-box">
                <video
                  ref={(el) => { videoRefs.current[cardMode] = el; }}
                  playsInline
                  muted
                  className={`mcs-video${cameraOn ? ' mcs-video--visible' : ''}`}
                />
                {!cameraOn && (
                  <div className="mcs-preview-placeholder">
                    <div className="mcs-preview-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <span className="mcs-preview-text">
                      {isSelected ? 'Toggle camera above to preview' : 'Select to preview camera'}
                    </span>
                  </div>
                )}
                {isSelected && isLive && (
                  <div className="mcs-selected-pill">● Live</div>
                )}
                {isSelected && isConference && (
                  <div className="mcs-selected-pill">● Conference</div>
                )}
                {isSelected && isWebinar && (
                  <div className="mcs-selected-pill">● Webinar</div>
                )}
              </div>

              {/* Name input */}
              <div className="mcs-input-group" onClick={(e) => e.stopPropagation()}>
                <label className="mcs-input-label">Your name</label>
                <input
                  className="mcs-input"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setNameState((prev) => ({ ...prev, [cardMode]: e.target.value }))}
                />
              </div>

              {/* Join button */}
              <button
                className={`mcs-join-btn${hasName ? ' mcs-join-btn--active' : ''}`}
                onClick={(e) => handleJoin(cardMode, e)}
                disabled={!hasName}
              >
                Join {config.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
