import React, { useEffect, useRef } from 'react';
import { ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { type Role } from './types';

type Props = {
    participants: any[];
    role: Role;
};

const TILE_GAP = 8;
const CONTAINER_PADDING = 10;
const OT_LAYOUT_OPTIONS = {
    maxRatio: 3 / 2,
    minRatio: 9 / 16,
    fixedRatio: false,
    alignItems: 'center' as const,
    bigClass: 'OT_big',
    bigPercentage: 0.8,
    bigFixedRatio: false,
    bigAlignItems: 'center' as const,
    smallAlignItems: 'center' as const,
    animate: false,
};

export default function OpentokLayout({ participants, role }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const layoutFnRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        let cancelled = false;
        import('opentok-layout-js').then((mod) => {
            if (cancelled || !containerRef.current) return;
            const initLayout = (mod as any).default ?? mod;
            const { layout } = initLayout(containerRef.current, OT_LAYOUT_OPTIONS);
            layoutFnRef.current = layout;
            layout();
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        layoutFnRef.current?.();
    }, [participants]);

    useEffect(() => {
        const onResize = () => layoutFnRef.current?.();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const tiles: Array<{ key: string; participant: any; source: Track.Source; isBig: boolean }> = [];

    for (const participant of participants) {
        if (participant.isLocal && role === 'viewer') continue;

        const hasCamera = !!participant.getTrackPublication(Track.Source.Camera);
        const hasScreen = !!participant.getTrackPublication(Track.Source.ScreenShare);
        const hasMic = !!participant.getTrackPublication(Track.Source.Microphone);

        if (!participant.isLocal && !hasCamera && !hasScreen && !hasMic) continue;

        if (hasScreen) {
            tiles.push({
                key: `${participant.identity}__screen`,
                participant,
                source: Track.Source.ScreenShare,
                isBig: true,
            });
        }
        if (hasCamera) {
            tiles.push({
                key: `${participant.identity}__camera`,
                participant,
                source: Track.Source.Camera,
                isBig: false,
            });
        }
        if (!hasCamera && !hasScreen && hasMic) {
            tiles.push({
                key: `${participant.identity}__audio`,
                participant,
                source: Track.Source.Camera,
                isBig: false,
            });
        }
    }

    return (
        <main
            ref={containerRef}
            style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                background: '#111',
                padding: CONTAINER_PADDING,
                boxSizing: 'border-box',
            }}
        >
            {tiles.map(({ key, participant, source, isBig }) => (
                <div
                    key={key}
                    className={isBig ? 'OT_big' : ''}
                    style={{
                        position: 'absolute',
                        padding: TILE_GAP / 2,
                        boxSizing: 'border-box',
                        background: 'transparent',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            background: '#1a1a1a',
                        }}
                    >
                        <ParticipantTile
                            trackRef={{
                                participant,
                                source,
                                publication: participant.getTrackPublication(source),
                            }}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            ))}
        </main>
    );
}
