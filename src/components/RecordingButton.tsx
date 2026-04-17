import { useCallback, useState } from 'react';
import { startRecording, stopRecording } from '../services/recordingService';
import recordIcon from '../assets/record.png';

export default function RecordingButton({ room, onToast }: { room: string; onToast: (m: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
        const res = await startRecording(room);
        console.log('start recording response', res);
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
      console.log('stop recording response', res);
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
      height: 44,
      width: 44,
      border: 'none',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      background: recording ? '#df3737' : '#333'
    }}
  >
    <img
      src={recordIcon}
      alt="record"
      style={{
        width: 20,
        height: 20,
        filter: recording ? 'brightness(0) invert(1)' : 'none'
      }}
    />
  </button>
);
}
