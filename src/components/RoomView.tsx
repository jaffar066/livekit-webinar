import { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import { RoomHeader } from './RoomHeader';
import { RoomFooter } from './RoomFooter';
import { type Role, type Mode } from './types';
import OpentokLayout from './OpentokLayout';

// ─────────────────────────────────────────────────────────────────────────────

export type RoomViewProps = {
    identity: string;
    room: string;
    role: Role;
    mode: Mode;
    cameraOn: boolean;
    onLeave: () => void;
    tokenServerUrl?: string;
    onRole?: (role: Role) => void;
};

function RoomContent({
    room,
    role,
    mode,
    onLeave,
}: {
    room: string;
    role: Role;
    mode: Mode;
    onLeave: () => void;
}) {
    const participants = useParticipants();
    const remoteCount = participants.filter((p) => !p.isLocal).length;

    // All layout logic moved into `OpentokLayout` component.

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <RoomHeader
                mode={mode}
                role={role}
                participants={participants.length}
                remoteCount={remoteCount}
            />

            {/* opentok-layout container */}
            <OpentokLayout participants={participants} role={role} />

            <RoomFooter room={room} role={role} mode={mode} onLeave={onLeave} />

            <RoomAudioRenderer />
        </div>
    );
}

// ─── Outer component: token fetching + LiveKitRoom (unchanged) ────────────────
export function RoomView({
    identity,
    room,
    role,
    mode,
    cameraOn,
    onLeave,
    tokenServerUrl,
}: RoomViewProps) {
    const tokenEndpoint =
        tokenServerUrl ??
        (import.meta.env.VITE_TOKEN_SERVER_URL as string) ??
        'http://localhost:3000/get-token';

    const [token, setToken] = useState<string | undefined>(undefined);
    const [serverUrl, setServerUrl] = useState<string>(
        (import.meta.env.VITE_LIVEKIT_URL as string) ?? 'ws://localhost:7880'
    );
    const [tokenError, setTokenError] = useState<string | undefined>(undefined);
    const [connectionError, setConnectionError] = useState<string | undefined>(undefined);

    useEffect(() => {
        setToken(undefined);
        setTokenError(undefined);
        setConnectionError(undefined);

        const url = new URL(tokenEndpoint);
        url.searchParams.set('room', room);
        url.searchParams.set('identity', identity);
        url.searchParams.set('role', role);

        fetch(url.toString())
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`token request failed: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                if (!data?.participant_token) {
                    throw new Error('token response missing participant_token');
                }
                if (data?.server_url) {
                    setServerUrl(data.server_url);
                }
                setToken(data.participant_token);
            })
            .catch((err) => {
                console.error('Failed to fetch token', err);
                setTokenError(String(err));
            });
    }, [tokenEndpoint, room, identity, role]);

    if (tokenError) {
        return (
            <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                <div style={{ marginBottom: 8, fontWeight: 600, color: '#b91c1c' }}>Token error</div>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'rgba(0,0,0,0.75)' }}>
                    {tokenError}
                </pre>
                <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                    Tried: <code>{tokenEndpoint}</code>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Connecting to token server…</div>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                    Requesting a token from <code>{tokenEndpoint}</code>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={role !== 'viewer'}
            video={role !== 'viewer' && cameraOn}
            onError={(err) => {
                console.error('LiveKit connection error', err);
                setConnectionError(String(err));
            }}
        >
            {connectionError ? (
                <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                    <div style={{ marginBottom: 8, fontWeight: 600, color: '#b91c1c' }}>
                        Connection error
                    </div>
                    <pre
                        style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'rgba(0,0,0,0.75)' }}
                    >
                        {connectionError}
                    </pre>
                    <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                        Confirm the LiveKit server is running at <code>{serverUrl}</code>
                    </div>
                </div>
            ) : (
                <RoomContent room={room} role={role} mode={mode} onLeave={onLeave} />
            )}
        </LiveKitRoom>
    );
}