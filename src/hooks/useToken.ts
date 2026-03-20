import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';

export type Role = 'host' | 'cohost' | 'viewer';

/**
 * Returns a TokenSource that will fetch JWT tokens from a backend token server.
 *
 * The token server should return JSON in the shape: { participant_token, server_url, role }.
 */
export function useTokenSource(tokenServerUrl?: string, onRole?: (role: Role) => void) {
  const baseUrl = tokenServerUrl ?? (import.meta.env.VITE_TOKEN_SERVER_URL as string) ?? 'http://localhost:3001/get-token';

  return useMemo(() => {
    return TokenSource.custom(async (opts) => {
      const url = new URL(baseUrl);
      if (opts.roomName) url.searchParams.set('room', opts.roomName);
      if (opts.participantIdentity) url.searchParams.set('identity', opts.participantIdentity);
      else if (opts.participantName) url.searchParams.set('identity', opts.participantName);

      const role = opts.participantAttributes?.role;
      if (role) url.searchParams.set('role', role);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (onRole && data?.role) {
        onRole(data.role);
      }

      return {
        participantToken: data?.participant_token ?? '',
        serverUrl: data?.server_url ?? '',
      };
    });
  }, [baseUrl, onRole]);
}
