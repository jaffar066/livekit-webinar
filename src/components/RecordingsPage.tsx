import { useEffect, useMemo, useRef, useState } from 'react';

type ViewMode = 'grid' | 'list';

function extractMeta(file: string) {
  const tsMatch = file.match(/-(\d{10,13})\.mp4$/i);
  const ts = tsMatch ? Number(tsMatch[1]) : 0;
  const roomRaw = file.replace(/-(\d{10,13})\.mp4$/i, '').replace(/\.mp4$/i, '');
  const room = roomRaw.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || file;
  return { ts, room };
}

function formatDate(ts: number) {
  if (!ts) return 'Unknown date';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function SkeletonCard() {
  return (
    <div className="rec-card rec-card--skeleton">
      <div className="rec-thumb--skeleton" />
      <div className="rec-card-body">
        <div className="rec-skel-line rec-skel-line--title" />
        <div className="rec-skel-line rec-skel-line--sub" />
        <div className="rec-skel-actions">
          <div className="rec-skel-btn" /><div className="rec-skel-btn" /><div className="rec-skel-btn" />
        </div>
      </div>
    </div>
  );
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const modalRef = useRef<HTMLDivElement>(null);

  const serverBaseUrl =
    (import.meta.env.VITE_SERVER_BASE_URL as string)?.replace(/\/$/, '') ||
    ((import.meta.env.VITE_TOKEN_SERVER_URL as string)?.replace(/\/get-token$/, '').replace(/\/$/, '') || 'http://localhost:3001');
  const backendUrl = serverBaseUrl;
  const recordingBase = `${backendUrl}/recordings`;

  const readRecordings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/recordings-list`, { method: 'GET', credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.recordings)) throw new Error('Invalid response structure');
      setRecordings(json.recordings.filter((r: unknown) => typeof r === 'string'));
    } catch (err: any) {
      setError(err?.message || 'Unable to load recordings');
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { readRecordings(); }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPlayingFile(null); setDeleteConfirm(null); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const deleteRecording = async (file: string) => {
    try {
      const res = await fetch(`${backendUrl}/delete-recording/${encodeURIComponent(file)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRecordings((prev) => prev.filter((r) => r !== file));
      if (playingFile === file) setPlayingFile(null);
    } catch (err: any) {
      alert('Failed to delete: ' + (err?.message || 'Unknown error'));
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recordings
      .filter((f) => typeof f === 'string' && f.toLowerCase().includes(q))
      .sort((a, b) => extractMeta(b).ts - extractMeta(a).ts);
  }, [recordings, search]);

  return (
    <div className="rec-page">
      {/* ── Header ── */}
      <div className="rec-header">
        <div className="rec-header-left">
          <div className="rec-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div>
            <h1 className="rec-title">Recording Library</h1>
            <p className="rec-subtitle">
              {loading ? 'Loading…' : `${recordings.length} recording${recordings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>


      {!loading && recordings.length > 0 && (
        <div className="rec-stats">
          <span className="rec-stat"><span className="rec-stat-num">{recordings.length}</span> Total</span>
          <span className="rec-stat-divider" />
          <span className="rec-stat">
            <span className="rec-stat-num">{recordings.filter(f => {
              const ts = extractMeta(f).ts;
              return ts && (Date.now() - ts) < 7 * 24 * 60 * 60 * 1000;
            }).length}</span> This week
          </span>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="rec-toolbar">
        <div className="rec-search-wrap">
          <svg className="rec-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="rec-search"
            type="text"
            placeholder="Search recordings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="rec-search-clear" onClick={() => setSearch('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="rec-toolbar-right">
          <button
            className={`rec-view-btn${viewMode === 'grid' ? ' rec-view-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button
            className={`rec-view-btn${viewMode === 'list' ? ' rec-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button className="rec-view-btn" onClick={readRecordings} disabled={loading} title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rec-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className={viewMode === 'grid' ? 'rec-grid' : 'rec-list'}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="rec-empty">
          <div className="rec-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.07A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="rec-empty-title">{search ? 'No matches found' : 'No recordings yet'}</p>
          <p className="rec-empty-sub">{search ? `Nothing matches "${search}"` : 'Start a session to create your first recording.'}</p>
          {search && <button className="rec-btn rec-btn--ghost" onClick={() => setSearch('')}>Clear search</button>}
        </div>
      )}

      {/* ── Cards grid ── */}
      {!loading && filtered.length > 0 && (
        <div className={viewMode === 'grid' ? 'rec-grid' : 'rec-list'}>
          {filtered.map((file) => {
            const { ts, room } = extractMeta(file);
            const url = `${recordingBase}/${encodeURIComponent(file)}`;
            return (
              <div key={file} className="rec-card" onClick={() => setPlayingFile(file)}>
                <div className="rec-thumb">
                  <div className="rec-thumb-overlay">
                    <div className="rec-play-btn">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                  <div className="rec-thumb-bg">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M15 10l4.553-2.07A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                </div>
                <div className="rec-card-body">
                  <p className="rec-card-room">{room}</p>
                  <p className="rec-card-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatDate(ts)}
                  </p>
                  <div className="rec-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="rec-action-btn rec-action-btn--play" onClick={() => setPlayingFile(file)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      Play
                    </button>
                    <a className="rec-action-btn rec-action-btn--dl" href={url} download onClick={(e) => e.stopPropagation()}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </a>
                    <button className="rec-action-btn rec-action-btn--del" onClick={() => setDeleteConfirm(file)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Video player modal ── */}
      {playingFile && (
        <div className="rec-modal-backdrop" onClick={() => setPlayingFile(null)}>
          <div className="rec-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="rec-modal-header">
              <div className="rec-modal-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{extractMeta(playingFile).room}</span>
              </div>
              <button className="rec-modal-close" onClick={() => setPlayingFile(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <video
              key={playingFile}
              src={`${recordingBase}/${encodeURIComponent(playingFile)}`}
              controls
              autoPlay
              className="rec-modal-video"
            />
            <p className="rec-modal-meta">{formatDate(extractMeta(playingFile).ts)}</p>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div className="rec-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="rec-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rec-confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h3 className="rec-confirm-title">Delete Recording?</h3>
            <p className="rec-confirm-sub">
              "<strong>{extractMeta(deleteConfirm).room}</strong>" will be permanently removed. This cannot be undone.
            </p>
            <div className="rec-confirm-actions">
              <button className="rec-btn rec-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="rec-btn rec-btn--danger" onClick={() => deleteRecording(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
