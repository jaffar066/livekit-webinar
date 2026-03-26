import { useEffect, useRef, useState } from 'react';
import { useChat, useLocalParticipant } from '@livekit/components-react';
import { FiX } from 'react-icons/fi';

export default function ChatPanel({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) {
    const { chatMessages, send, isSending } = useChat();
    const { localParticipant } = useLocalParticipant();
    const [text, setText] = useState('');
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        try {
            await send(trimmed);
            setText('');
        } catch (err) {
            console.error('Failed to send chat message', err);
        }
    };

    if (!visible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
                zIndex: 60,
                pointerEvents: 'auto',
            }}
        >
            <div
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
            />

            <aside
                style={{
                    width: 380,
                    height: '60vh',
                    margin: 32,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#fff',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: 'translateY(0)',
                    transition: 'transform 200ms ease',
                }}
                aria-modal
                role="dialog"
            >
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'linear-gradient(90deg,#0ea5e9,#7dd3fc)', color: '#fff' }}>
                    <div style={{ fontWeight: 700 }}>Room Chat</div>
                    <button onClick={onClose} aria-label="Close chat" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <FiX />
                    </button>
                </header>

                <div ref={listRef} style={{ padding: 14, overflowY: 'auto', flex: 1, background: '#f7fafc' }}>
                    {chatMessages.length === 0 && (
                        <div style={{ color: 'rgba(0,0,0,0.45)', textAlign: 'center', marginTop: 24 }}>No messages yet — say hi 👋</div>
                    )}
                    {chatMessages.map((m) => {
                        const isLocal = !!(m.from && localParticipant && m.from.identity === localParticipant.identity);
                        const wrapperStyle: any = {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isLocal ? 'flex-end' : 'flex-start',
                            marginBottom: 12,
                        };

                        const nameStyle: any = {
                            fontSize: 12,
                            color: isLocal ? '#0369a1' : '#6b7280',
                            marginBottom: 6,
                        };

                        const bubbleStyle: any = {
                            display: 'inline-block',
                            background: isLocal ? '#e0f2fe' : '#fff',
                            padding: '10px 14px',
                            borderRadius: 14,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            maxWidth: '80%',
                            textAlign: 'left',
                        };

                        return (
                            <div key={m.id} style={wrapperStyle}>
                                <div style={nameStyle}>
                                    <strong>{m.from?.identity ?? 'System'}</strong>
                                    <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div style={bubbleStyle}>{m.message}</div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Write a message..."
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #e6edf3' }}
                    />
                    <button onClick={handleSend} disabled={isSending || !text.trim()} style={{ padding: '10px 14px', borderRadius: 10, background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Send
                    </button>
                </div>
            </aside>
        </div>
    );
}
