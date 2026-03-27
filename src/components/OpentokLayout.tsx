import { useEffect, useRef } from 'react';
import { ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { FiMic } from 'react-icons/fi';

export default function OpentokLayout({ participants, role }: { participants: any[]; role: any }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const layoutFnRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        import('opentok-layout-js').then((mod) => {
            const init = (mod as any).default ?? mod;
            const { layout } = init(containerRef.current, { maxRatio: 3/2, minRatio: 9/16, bigClass: 'OT_big', bigPercentage: 0.8 });
            layoutFnRef.current = layout;
            layout();
        });
    }, []);

    useEffect(() => { layoutFnRef.current?.(); }, [participants]);

    return (
        <main ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#111', padding: 10 }}>
            {participants.map((p) => {
                if (p.isLocal && role === 'viewer') return null;
                
                // Track sources
                const cameraPub = p.getTrackPublication(Track.Source.Camera);
                const screenPub = p.getTrackPublication(Track.Source.ScreenShare);
                const source = screenPub ? Track.Source.ScreenShare : Track.Source.Camera;

                return (
                    <div key={p.identity} className={screenPub ? 'OT_big' : ''} style={{ position: 'absolute', padding: 4, boxSizing: 'border-box' }}>
                        <div style={{
                            width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', 
                            background: '#1a1a1a', position: 'relative',
                            outline: p.isSpeaking ? '2px solid #e91b1b' : '1px solid #333',
                            boxShadow: p.isSpeaking ? '0 0 15px rgba(233, 27, 27, 0.4)' : 'none'
                        }}>
                            
                            {/* THE MIC ICON - Forced to front */}
                            {p.isSpeaking && (
                                <div style={{
                                    position: 'absolute', 
                                    top: 12, 
                                    right: 12, 
                                    zIndex: 100, // Higher than LiveKit layers
                                    background: '#e91b1b', 
                                    color: '#fff', 
                                    width: 26, 
                                    height: 26, 
                                    borderRadius: '50%',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                                }}>
                                    <FiMic size={14} />
                                </div>
                            )}

                            <ParticipantTile 
                                trackRef={{ 
                                    participant: p, 
                                    source: source,
                                    publication: screenPub || cameraPub 
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