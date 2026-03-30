import { useEffect, useState } from 'react';

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);

  const serverBaseUrl =
    (import.meta.env.VITE_SERVER_BASE_URL as string)?.replace(/\/$/, '') ||
    ((import.meta.env.VITE_TOKEN_SERVER_URL as string)?.replace(/\/get-token$/, '').replace(/\/$/, '') || 'http://localhost:3001');
  const backendUrl = serverBaseUrl;

  const readRecordings = async () => {
    setLoading(true);
    setError(null);
    setSelectedRecording(null);

    try {
      const res = await fetch(`${backendUrl}/recordings-list`, {
      method: 'GET',
      credentials: 'include', // <--- THIS IS REQUIRED
    });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.recordings)) throw new Error('Invalid response structure');
      setRecordings(json.recordings);
    } catch (err: any) {
      setError(err?.message || 'Unable to load recordings');
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    readRecordings();
  }, []);

  const recordingBase = `${backendUrl}/recordings`;

  return (
    <div style={{ color: '#fff', minHeight: 400, background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Recording Library</h2>
        <button
          onClick={readRecordings}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #5a5a5a', background: '#222', color: '#fff', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loading && <div>Loading recordings…</div>}
      {error && <div style={{ color: 'salmon' }}>{error}</div>}
      {!loading && !error && recordings.length === 0 && <div>No recordings found.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {recordings.map((file) => {
          const url = `${recordingBase}/${encodeURIComponent(file)}`;
          const ts = Number((file.match(/-(\d+)\.mp4$/) ?? [])[1]) || Date.now();
          return (
            <div key={file} style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: 10, background: '#111' }}>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4, fontSize: 13 }}>{file}</div>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 6 }}>{new Date(ts).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSelectedRecording(file)}
                  style={{ flex: 1, borderRadius: 8, border: '1px solid #5a5a5a', background: '#2a2a2a', color: '#fff', padding: '6px', cursor: 'pointer' }}
                >
                  Play
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, borderRadius: 8, border: '1px solid #5a5a5a', background: '#2a2a2a', color: '#fff', padding: '6px', textAlign: 'center', textDecoration: 'none' }}
                >
                  Download
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRecording && (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ margin: '0 0 8px', color: '#fff' }}>Now playing: {selectedRecording}</h3>
          <video
            src={`${recordingBase}/${encodeURIComponent(selectedRecording)}`}
            controls
            style={{ width: '100%', maxHeight: 380, borderRadius: 10, background: '#000' }}
          />
        </div>
      )}
    </div>
  );
}
