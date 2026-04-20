import { useState, useRef, useEffect } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { BackgroundProcessor, supportsBackgroundProcessors } from '@livekit/track-processors';
import bgImage from '../assets/image.png';
import bgImage1 from '../assets/wooden-self.jpg';
import { FiX, FiImage } from 'react-icons/fi';

type BgMode = 'none' | 'blur' | 'virtual' | 'virtual3' | 'custom';

const IMAGES = [
  { id: 'virtual'  as BgMode, label: 'Altegon', src: bgImage  },
  { id: 'virtual3' as BgMode, label: 'Nature',  src: bgImage1 },
];

export function BackgroundSelector() {
  const { localParticipant } = useLocalParticipant();
  const [mode, setMode] = useState<BgMode>('none');
  const [open, setOpen] = useState(false);
  const [customSrc, setCustomSrc] = useState<string | null>(null);
  const [supported] = useState(() => supportsBackgroundProcessors());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-bg-selector', handler);
    return () => document.removeEventListener('open-bg-selector', handler);
  }, []);

  if (!supported) return null;

  const getVideoTrack = () =>
    localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack ?? null;

  const apply = async (next: BgMode, imgSrc?: string) => {
    const track = getVideoTrack();
    if (!track) return;
    if (next === 'none') {
      await track.stopProcessor();
    } else if (next === 'blur') {
      await track.setProcessor(BackgroundProcessor({ mode: 'background-blur', blurRadius: 30 }));
    } else {
      const src = imgSrc ?? customSrc ?? bgImage;
      await track.setProcessor(BackgroundProcessor({ mode: 'virtual-background', imagePath: src }));
    }
    setMode(next);
    if (next !== 'none') setOpen(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomSrc(url);
    apply('custom', url);
  };

  const cardStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
    border: `2px solid ${active ? '#63b3ed' : 'transparent'}`,
    transition: 'border-color 0.15s',
  });

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e1e1e', borderRadius: '16px 16px 0 0',
              padding: 20, width: '100%', maxWidth: 480,
              maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Background</span>
              <FiX onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <div style={cardStyle(mode === 'none')} onClick={() => apply('none')}>
                <div style={{ height: 80, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>None</div>
                <div style={{ fontSize: 11, textAlign: 'center', padding: '5px 0', color: 'rgba(255,255,255,0.7)', background: '#222' }}>Off</div>
              </div>

              <div style={cardStyle(mode === 'blur')} onClick={() => apply('blur')}>
                <div style={{ height: 80, background: '#1a1a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌫️</div>
                <div style={{ fontSize: 11, textAlign: 'center', padding: '5px 0', color: 'rgba(255,255,255,0.7)', background: '#222' }}>Blur</div>
              </div>

              {IMAGES.map(img => (
                <div key={img.id} style={cardStyle(mode === img.id)} onClick={() => apply(img.id, img.src)}>
                  <img src={img.src} alt={img.label} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                  <div style={{ fontSize: 11, textAlign: 'center', padding: '5px 0', color: 'rgba(255,255,255,0.7)', background: '#222' }}>{img.label}</div>
                </div>
              ))}

              <div style={cardStyle(mode === 'custom')} onClick={() => fileRef.current?.click()}>
                <div style={{ height: 80, background: '#2a2a2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden' }}>
                  {customSrc
                    ? <img src={customSrc} alt="custom" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <><FiImage size={22} color="rgba(255,255,255,0.3)" /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Upload</span></>
                  }
                </div>
                <div style={{ fontSize: 11, textAlign: 'center', padding: '5px 0', color: 'rgba(255,255,255,0.7)', background: '#222' }}>Custom</div>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          </div>
        </div>
      )}
    </>
  );
}

export default BackgroundSelector;