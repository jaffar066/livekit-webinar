const BASE_URL = (import.meta as any).env?.VITE_SERVER_BASE_URL;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

export type StartRecordingResponse = {
  success: boolean;
  egressId?: string;
  filepath?: string;
  error?: string;
};

export async function startRecording(room: string): Promise<StartRecordingResponse> {
  const res = await fetch(`${BASE_URL}/start-recording`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ room }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: json?.error || 'Failed to start' };
  return json as StartRecordingResponse;
}

export async function stopRecording(egressId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/stop-recording`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ egressId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: json?.error || 'Failed to stop' };
  return json as { success: boolean; error?: string };
}
