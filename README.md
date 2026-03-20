# LiveKit Webinar (backend + frontend)

This workspace contains a minimal **LiveKit webinar demo** with:

- `backend/` — a token server that mints LiveKit tokens (host/cohost/viewer)
- `webinar-fe/` — a simple React + Vite frontend that connects to the backend

## Run the backend

```bash
cd backend
npm install
npm run dev
```

The backend listens on `http://localhost:3001` and exposes `/get-token`.

## Run the frontend

```bash
cd webinar-fe
npm install
npm run dev
```

The frontend reads `VITE_TOKEN_SERVER_URL` from `webinar-fe/.env` (defaults to `http://localhost:3001/get-token`).


## What is LiveKit and why do I need it?

LiveKit is an open source WebRTC SFU (Selective Forwarding Unit) for real-time audio/video. This demo requires a running LiveKit server to handle media streams and room state. You can run it locally for development, or deploy it to a remote server for production.

## Run a LiveKit server locally

You need a running LiveKit server for this demo. The easiest way is using Docker:

### Using Docker

```bash
docker run --rm -it \
	-p 7880:7880 \
	-p 7881:7881 \
	-e LIVEKIT_KEYS="devkey:secret" \
	-e LIVEKIT_API_KEY=devkey \
	-e LIVEKIT_API_SECRET=secret \
	livekit/livekit-server:latest --dev
```

### Using a binary

Download the latest release from: https://docs.livekit.io/deploy/server/

```bash
./livekit-server --dev
```

The server will listen on `ws://localhost:7880` (WebSocket) and `http://localhost:7881` (HTTP API) by default.

## Example .env for the frontend

Create a file `webinar-fe/.env`:

```
VITE_TOKEN_SERVER_URL=http://localhost:3001/get-token
VITE_LIVEKIT_URL=ws://localhost:7880
```

## Running LiveKit on a remote server

1. Follow the official docs: https://docs.livekit.io/deploy/server/
2. Make sure to expose ports **7880** (WebSocket) and **7881** (HTTP API) to the public internet.
3. Set your `VITE_LIVEKIT_URL` and backend token server to point to your remote server in your `.env`:
	 ```
	 VITE_LIVEKIT_URL=wss://your-server:7880
	 VITE_TOKEN_SERVER_URL=https://your-backend/get-token
	 ```
4. Update CORS and firewall rules as needed.

## Troubleshooting

- If you see connection errors, check that your LiveKit server is running and accessible at the URL in your `.env`.
- If you see blank video or no video element, make sure your browser has camera permissions and the LiveKit server is reachable.
- For production, use secure WebSocket (`wss://`) and HTTPS for your backend.

## Notes

- The frontend is intentionally minimal and keeps the UI simple.
- This setup is for development/demo purposes only; do not expose dev credentials in production.

## Notes

- The frontend is intentionally minimal and keeps the UI simple.
- This setup is for development/demo purposes only; do not expose dev credentials in production.
