import { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useParticipants, useChat,
 useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { RoomHeader } from './RoomHeader';
import { RoomFooter } from './RoomFooter';
import { type Role, type Mode } from './types';
import OpentokLayout from './OpentokLayout';
import ChatPanel from './ChatPanel';

export type RoomViewProps = {
    identity: string; room: string; role: Role; mode: Mode; cameraOn: boolean; onLeave: () => void;
    tokenServerUrl?: string, onRole?: (role: Role) => void;
};

function RoomContent({ room, role, mode, onLeave }: any) {
  const participants = useParticipants();
  const [chatVisible, setChatVisible] = useState(false);
  const { chatMessages } = useChat();
  const { localParticipant } = useLocalParticipant();
  const [lastSeen, setLastSeen] = useState(Date.now());

  const unreadCount = chatMessages.filter(m => m.timestamp > lastSeen && m.from?.identity !== localParticipant?.identity).length;

  const toggleChat = () => {
    setChatVisible(!chatVisible);
    if (!chatVisible) setLastSeen(chatMessages.reduce((max, m) => Math.max(max, m.timestamp), 0) || Date.now());
  };

  const otherIsSharing = participants.some(p => !p.isLocal && !!p.getTrackPublication?.(Track.Source.ScreenShare));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <RoomHeader mode={mode} role={role} participants={participants.length} remoteCount={participants.filter(p => !p.isLocal).length} />
      <OpentokLayout participants={participants} role={role} />
        <RoomFooter  roomName={room} role={role} mode={mode} onLeave={onLeave} onToggleChat={toggleChat}
        chatVisible={chatVisible} unreadCount={unreadCount} otherIsSharing={otherIsSharing} />
      <ChatPanel visible={chatVisible} onClose={() => setChatVisible(false)} />
      <RoomAudioRenderer />
    </div>
  );
}

export function RoomView({ identity, room, role, mode, cameraOn, onLeave, tokenServerUrl }: RoomViewProps) {
  const [state, setState] = useState<{ token?: string; url?: string; err?: string }>({});
  const endpoint = tokenServerUrl ?? import.meta.env.VITE_TOKEN_SERVER_URL ?? 'http://localhost:3000/get-token';

  useEffect(() => {
    fetch(`${endpoint}?room=${room}&identity=${identity}&role=${role}`)
      .then(res => res.json())
      .then(data => setState({ token: data.participant_token, url: data.server_url }))
      .catch(err => setState({ err: err.message }));
  }, [room, identity, role]);

  if (state.err) return <div style={{ color: 'red', padding: 20 }}>Error: {state.err}</div>;
  if (!state.token) return <div style={{ padding: 20, color: '#fff' }}>Connecting...</div>;

  return (
    <LiveKitRoom 
      token={state.token} 
      serverUrl={state.url ?? 'ws://localhost:7880'} 
      connect={true} 
      audio={role !== 'viewer'} 
      video={role !== 'viewer' && cameraOn}
    >
      <RoomContent room={room} role={role} mode={mode} onLeave={onLeave} />
    </LiveKitRoom>
  );
}