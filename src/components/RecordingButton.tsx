import { useCallback, useState } from 'react';
import { startRecording, stopRecording } from '../services/recordingService';

function RecordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default function RecordingButton({ room, onToast }: { room: string; onToast: (m: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const res = await startRecording(room);
      if (!res.success) throw new Error(res.error || 'start failed');
      setEgressId(res.egressId ?? null);
      setRecording(true);
      onToast(res.filepath ? `Recording started — saved to ${res.filepath}` : 'Recording started');
    } catch (err) {
      console.error(err);
      onToast('Failed to start recording');
    }
  }, [room, onToast]);

  const stop = useCallback(async () => {
    try {
      if (!egressId) { onToast('No recording in progress'); return; }
      const res = await stopRecording(egressId);
      if (!res.success) throw new Error(res.error || 'stop failed');
      setRecording(false);
      setEgressId(null);
      onToast('Recording stopped');
    } catch (err) {
      console.error(err);
      onToast('Failed to stop recording');
    }
  }, [egressId, onToast]);

  return (
    <button
      onClick={() => (recording ? stop() : start())}
      title={recording ? 'Stop recording' : 'Start recording'}
      style={{
        height: 44, width: 44, border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, cursor: 'pointer', color: '#fff', background: recording ? '#df3737' : '#333'
      }}
    >
      {recording ? <StopIcon /> : <RecordIcon />}
    </button>
  );
}
