import { useEffect, useRef, useState } from 'react';
import { useChat, useLocalParticipant } from '@livekit/components-react';
import { FiX, FiSmile, FiSend } from 'react-icons/fi';

export default function ChatPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant } = useLocalParticipant();
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const EMOJIS = ['👋', '😊', '😂', '👍', '🔥', '❤️', '🌎', '🙌'];

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await send(text.trim());
    setText('');
    setShowEmojis(false);
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      <aside style={{
        width: 360, height: '550px', margin: 24, borderRadius: 16, overflow: 'hidden',
        background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        <header style={{ padding: '16px', background: '#0ea5e9', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Room Chat</span>
          <FiX onClick={onClose} style={{ cursor: 'pointer' }} />
        </header>

        <div ref={listRef} style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatMessages.length === 0 && (
            <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20, fontSize: 13 }}>No messages yet...</div>
          )}
          
          {chatMessages.map((m) => {
            const isLocal = m.from?.identity === localParticipant?.identity;
            return (
              <div key={m.id} style={{ alignSelf: isLocal ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textAlign: isLocal ? 'right' : 'left' }}>
                  {isLocal ? 'You' : m.from?.identity} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '14px', fontSize: 14,
                  // LOCAL = BLUE | REMOTE = RED
                  background: isLocal ? '#0ea5e9' : '#dc2626', 
                  color: '#fff', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  border: 'none'
                }}>
                  {m.message}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Emoji Bar */}
        {showEmojis && (
          <div style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#fff', borderTop: '1px solid #f1f5f9', justifyContent: 'center' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setText(prev => prev + e)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
        )}

        <div style={{ padding: 12, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'center', background: '#fff' }}>
          <button onClick={() => setShowEmojis(!showEmojis)} style={{ background: 'none', border: 'none', color: showEmojis ? '#0ea5e9' : '#64748b', cursor: 'pointer', display: 'flex' }}>
            <FiSmile size={20} />
          </button>
          
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14 }}
          />

          <button 
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            style={{ 
              background: text.trim() ? '#0ea5e9' : '#cbd5e1', color: '#fff', border: 'none', 
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s'
            }}
          >
            <FiSend size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
}