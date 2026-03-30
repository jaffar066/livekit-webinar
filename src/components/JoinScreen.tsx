import { useState } from 'react';
import type { Mode, Role } from './types';
import { ModeCardSelector } from './ModeCardSelector';

export type JoinProps = {
  onJoin: (opts: { identity: string; role: Role; mode: Mode; cameraOn: boolean }) => void;
  defaultIdentity?: string;
  defaultRole?: Role;
  defaultMode?: Mode;
  defaultCameraOn?: boolean;
  forcedMode?: Mode;
  forcedRole?: Role;
};

export function JoinScreen({
  onJoin,
  defaultRole = 'host',
  defaultMode,
  defaultCameraOn = false,
  forcedMode,
  forcedRole,
}: JoinProps) {
  const [activePanel, setActivePanel] = useState<'join' | 'recordings'>('join');

  return (
    <div className="join-screen">
      <ModeCardSelector
        forcedMode={forcedMode}
        defaultMode={defaultMode}
        defaultCameraOn={defaultCameraOn}
        activePanel={activePanel}
        onPanelChange={(panel) => setActivePanel(panel)}
        onJoin={({ mode, cameraOn, name }) => {
          onJoin({
            identity: name.trim(),
            role: forcedRole ?? defaultRole,
            mode,
            cameraOn,
          });
        }}
      />
    </div>
  );
}