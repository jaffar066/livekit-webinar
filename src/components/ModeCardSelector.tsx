import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Mode } from './types';

const MODE_CONFIG: Record<
  Mode,
  { title: string; accent: string; emoji: string }
> = {
  live: {
    title: 'Live streaming',
    accent: '#ef4444',
    emoji: '🔴',
  },
  webinar: {
    title: 'Webinar',
    accent: '#3b82f6',
    emoji: '🎤',
  },
  conference: {
    title: 'Conference',
    accent: '#10b981',
    emoji: '👥',
  },
};

export type ModeCardSelectorProps = {
  forcedMode?: Mode;
  defaultMode?: Mode;
  defaultCameraOn?: boolean;
  onChange?: (selection: { mode?: Mode; cameraOn: boolean }) => void;
};

export function ModeCardSelector({
  forcedMode,
  defaultCameraOn = false,
  onChange,
}: ModeCardSelectorProps) {
  // Start with no selection by default unless `forcedMode` is provided.
  const [mode, setMode] = useState<Mode | undefined>(forcedMode ?? undefined);
  const [cameraOnState, setCameraOnState] = useState<Record<Mode, boolean>>(() => ({
    live: defaultCameraOn,
    webinar: defaultCameraOn,
    conference: defaultCameraOn,
  }));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isFirstRender = useRef(true);

  const selectedCameraOn = mode ? cameraOnState[mode] : false;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange?.({ mode, cameraOn: selectedCameraOn });
  }, [mode, selectedCameraOn, onChange]);

  useEffect(() => {
    const cleanup = () => {
      if (!streamRef.current) return;
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (!selectedCameraOn || !mode) {
      cleanup();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (!selectedCameraOn) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cleanup();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            // ignore autoplay errors
          });
        }
      })
      .catch(() => {
        if (mode) setCameraOnState((prev) => ({ ...prev, [mode]: false }));
      });

    return cleanup;
  }, [mode, selectedCameraOn]);

  const cardStyle: CSSProperties = useMemo(
    () => ({
      flex: 1,
      minWidth: 240,
      borderRadius: 14,
      border: '1px solid rgba(0,0,0,0.06)',
      padding: 18,
      cursor: 'pointer',
      background: '#fff',
      boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border 150ms ease, box-shadow 150ms ease',
    }),
    []
  );

  const selectedCardStyle: CSSProperties = useMemo(
    () => ({
      borderColor: '#3b82f6',
      boxShadow: '0 12px 28px rgba(59,130,246,0.22)',
    }),
    []
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        flexWrap: 'wrap',
        marginBottom: 20,
        justifyContent: 'center',
        padding: '0 10px',
      }}
    >
      {(forcedMode ? [forcedMode] : (['live', 'webinar', 'conference'] as Array<Mode>)).map(
        (cardMode) => {
          const config = MODE_CONFIG[cardMode];
          const selected = mode === cardMode;
          const cameraOn = cameraOnState[cardMode];

          return (
            <div
              key={cardMode}
              onClick={() => {
                if (!forcedMode) setMode(cardMode);
              }}
              style={{
                ...cardStyle,
                ...(selected ? selectedCardStyle : {}),
                opacity: selected ? 1 : 0.98,
                borderTop: `4px solid ${config.accent}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{config.emoji}</span>
                    <span>{config.title}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={cameraOn}
                      onChange={(e) => {
                        e.stopPropagation();
                        setCameraOnState((prev) => ({ ...prev, [cardMode]: e.target.checked }));
                      }}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: 36,
                        height: 18,
                        borderRadius: 16,
                        padding: 3,
                        background: cameraOn ? `${config.accent}22` : '#f3f4f6',
                        border: cameraOn ? `1px solid ${config.accent}44` : '1px solid rgba(15,23,42,0.08)',
                        boxShadow: '0 2px 8px rgba(2,6,23,0.06)',
                        transition: 'all 150ms ease',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 12,
                          background: cameraOn ? config.accent : '#322c2c',
                          border: cameraOn ? '1px solid #f8fafc' : '1px solid rgba(2,6,23,0.06)',
                          transform: cameraOn ? 'translateX(16px)' : 'translateX(0px)',
                          transition: 'transform 150ms ease, background 150ms ease',
                        }}
                      />
                    </div>
                  </label>
                  <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{cameraOn ? 'On' : 'Off'}</div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  border: '1px solid rgba(15,23,42,0.04)',
                  background: 'linear-gradient(180deg,#ffffff, #f8fafc)',
                  height: 140,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {selected && cameraOn ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#374151', padding: '6px 12px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {cameraOn ? 'Preview available when selected' : 'Camera is off'}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6, color: '#6b7280' }}>
                      {selected
                        ? 'Toggle camera to preview before joining.'
                        : 'Select this mode to preview your video.'}
                    </div>
                    {!cameraOn && (
                      <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af' }}>No camera stream active</div>
                    )}
                  </div>
                )}
                <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, color: '#6b7280' }}>
                  <span style={{ background: '#fff', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)' }}>
                    {selected ? 'Selected' : 'Preview'}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
