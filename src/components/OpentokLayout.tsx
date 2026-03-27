import { useEffect, useRef, useMemo } from 'react';
import { ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { FiMic } from 'react-icons/fi';

export default function OpentokLayout({ participants, role }: { participants: any[]; role: any }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const layoutFnRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        import('opentok-layout-js').then((mod) => {
            const init = (mod as any).default ?? mod;
            const { layout } = init(containerRef.current, { 
                maxRatio: 3/2, 
                minRatio: 9/16, 
                bigClass: 'OT_big', 
                bigPercentage: 0.8 
            });
            layoutFnRef.current = layout;
            layout();
        });
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
            {/* Prevent mirrored transform for screen-share videos (override scaleX(-1)) */}
            <style>{`.no-mirror video, .no-mirror iframe, .no-mirror img { transform: none !important; -webkit-transform: none !important; }`}</style>
            {tiles.map((tile) => (
                <div 
                    key={tile.id} 
                    className={`${tile.isBig ? 'OT_big' : ''} ${tile.source === Track.Source.ScreenShare ? 'no-mirror' : ''}`.trim()} 
                    style={{ position: 'absolute', padding: 4, boxSizing: 'border-box' }}
                >
                    <div style={{
                        width: '100%', 
                        height: '100%', 
                        borderRadius: 12, 
                        overflow: 'hidden', 
                        background: '#1a1a1a', 
                        position: 'relative',
                        // Red border/outline sirf Camera tile ke liye jab banda bole
                        outline: (tile.participant.isSpeaking && tile.source === Track.Source.Camera) 
                            ? '2px solid #e91b1b' 
                            : '1px solid #333',
                        boxShadow: (tile.participant.isSpeaking && tile.source === Track.Source.Camera) 
                            ? '0 0 15px rgba(233, 27, 27, 0.4)' 
                            : 'none'
                    }}>
                        
                        {/* Mic Icon sirf Camera tile par */}
                        {tile.participant.isSpeaking && tile.source === Track.Source.Camera && (
                            <div style={{
                                position: 'absolute', top: 12, right: 12, zIndex: 100,
                                background: '#e91b1b', color: '#fff', width: 26, height: 26, 
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                            }}>
                                <FiMic size={14} />
                            </div>
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
            ))}
        </main>
    );
}