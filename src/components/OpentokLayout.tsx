import { useEffect, useRef, useMemo, useState } from 'react';
import { ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { FiMic, FiMaximize, FiMinimize } from 'react-icons/fi';

export default function OpentokLayout({ participants, role }: { participants: any[]; role: any }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const layoutFnRef = useRef<(() => void) | null>(null);
    const [maximizedTileId, setMaximizedTileId] = useState<string | null>(null);

    useEffect(() => {
        let layout: any;
        import('opentok-layout-js').then((mod) => {
            const init = (mod as any).default ?? mod;
            const instance = init(containerRef.current, {
                maxRatio: 3 / 2,
                minRatio: 9 / 16,
                bigClass: 'OT_big',
                bigPercentage: 0.8
            });
            layout = instance.layout;
            layoutFnRef.current = layout;
            layout();
        });
        const handleResize = () => {
            if (layoutFnRef.current) {
                layoutFnRef.current();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const tiles = useMemo(() => {
        return participants.flatMap((p) => {
            const cameraPub = p.getTrackPublication(Track.Source.Camera);
            const screenPub = p.getTrackPublication(Track.Source.ScreenShare);
            const micPub = p.getTrackPublication(Track.Source.Microphone);
            const isViewer = !cameraPub && !screenPub && !micPub;
            if (isViewer && !p.isLocal) return [];
            if (p.isLocal && role === 'viewer') return [];
            const items = [];
            if (screenPub && screenPub.isSubscribed) {
                items.push({
                    id: `${p.identity}-screen`,
                    participant: p,
                    source: Track.Source.ScreenShare,
                    publication: screenPub,
                    isBig: true,
                });
            }
            items.push({
                id: `${p.identity}-camera`,
                participant: p,
                source: Track.Source.Camera,
                publication: cameraPub,
                isBig: false,
            });
            return items;
        });
    }, [participants, role]);

    useEffect(() => {
        if (layoutFnRef.current) {
            const timeout = setTimeout(() => {
                layoutFnRef.current?.();
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [tiles]);

    return (
        <main
            ref={containerRef}
            style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#111', padding: 10 }}
        >

            {tiles.map((tile) => {
                const isMaximized = maximizedTileId === tile.id;

                return (
                    <div
                        key={tile.id}
                        className={`
                            ${tile.isBig ? 'OT_big' : ''} 
                            ${tile.source === Track.Source.ScreenShare ? 'no-mirror' : ''}
                            ${isMaximized ? 'maximized-tile' : ''}
                        `.trim()}
                        style={{ position: 'absolute', padding: 4, boxSizing: 'border-box', transition: 'all 0.3s ease' }}
                    >
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: isMaximized ? 0 : 12,
                            overflow: 'hidden',
                            background: '#1a1a1a',
                            position: 'relative',
                            outline: (tile.participant.isSpeaking && tile.source === Track.Source.Camera)
                                ? '2px solid #e91b1b'
                                : '1px solid #333',
                        }}>

                            {/* Mic Icon */}
                            {tile.participant.isSpeaking && tile.source === Track.Source.Camera && (
                                <div style={{
                                    position: 'absolute', top: 12, right: 12, zIndex: 100,
                                    background: '#e91b1b', color: '#fff', width: 26, height: 26,
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FiMic size={14} />
                                </div>
                            )}

                            {/* Maximize/Minimize Button - Only for Screen Share */}
                            {tile.source === Track.Source.ScreenShare && (
                                <button
                                    onClick={() => setMaximizedTileId(isMaximized ? null : tile.id)}
                                    style={{
                                        position: 'absolute', bottom: 12, right: 12, zIndex: 110,
                                        background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                                        width: 32, height: 32, borderRadius: '6px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                    title={isMaximized ? "Minimize" : "Maximize"}
                                >
                                    {isMaximized ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                                </button>
                            )}

                            <ParticipantTile
                                trackRef={{
                                    participant: tile.participant,
                                    source: tile.source,
                                    publication: tile.publication
                                }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                );
            })}
        </main>
    );
}