LiveKit Webinar — Simple self-hosted quick start

What this is
- A tiny demo that shows video calls (camera + screen share) using LiveKit.
- There are three parts you run on your computer:
  1. LiveKit server (handles video/audio traffic)
  2. Token server (a small backend that gives the frontend a temporary login token)
  3. Frontend (the web page you open in your browser)

Goal
- Get a working call with two or more browser windows in a few commands. No deep technical knowledge required.

Summary (one-line steps)
1) Start LiveKit server (Docker)  2) Start token server (backend)  3) Start the frontend and open it in your browser

Step-by-step (the simplest way)

1) Start LiveKit server (run this in a terminal)

This runs the LiveKit service that moves video/audio between participants.

```bash
docker run --rm -it \
  -p 7880:7880 \
  -p 7881:7881 \
  -e LIVEKIT_KEYS="devkey:secret" \
  -e LIVEKIT_API_KEY=devkey \
  -e LIVEKIT_API_SECRET=secret \
  livekit/livekit-server:latest --dev
```

What it does for you: exposes a local address `ws://localhost:7880` that other parts can use to connect.

If you cannot use Docker, you can download a LiveKit binary from the official docs and run `./livekit-server --dev` instead.

2) Start the token server (this demo's backend)

Why: the frontend needs a short-lived token to join a room. The token server mints that token for you.

```bash
cd backend
npm install
npm run dev
```

After this, the token server usually listens at `http://localhost:3001` and has a simple endpoint `/get-token`.

3) Start the frontend (open the web app)

Create a file `webinar-fe/.env` with these two lines (these tell the web app where to find the LiveKit server and the token server):

```
VITE_LIVEKIT_URL=ws://localhost:7880
VITE_TOKEN_SERVER_URL=http://localhost:3001/get-token
```

Then run:

```bash
cd webinar-fe
npm install
npm run dev
```

Open the URL shown by the `npm run dev` output (usually `http://localhost:5173`) in two or more browser windows or tabs.

How to join a call
- In each browser window, enter the same room name and a different name for yourself (for example `alice`, `bob`).
- Click Join — the frontend asks the token server for a token, then connects to the LiveKit server.
- Allow camera/microphone permission when the browser asks.

If you want screen share
- Use the Share screen button in the UI; other participants will see your shared screen.

Very short troubleshooting (plain words)
- If you see no video: make sure the LiveKit server is running (step 1) and the token server is running (step 2).
- If the page says it can't get a token: check `VITE_TOKEN_SERVER_URL` in `webinar-fe/.env` and that the backend is running on that address.
- If screens or people are hidden during screen-share: open the browser DevTools Console to check that the app shows all participants (the app prints participant names when they change).

Optional: mint a token by hand
- For testing you can request a token directly from the token server:

```bash
curl "http://localhost:3001/get-token?room=demo&identity=alice"
```

That returns a token string you could paste into a custom client.

Notes
- This setup is for local development and demos. For a public production setup you would run LiveKit on a server, use HTTPS/WSS, and secure your token endpoint.
- If you want, I can add a tiny ready-to-run token server script in `backend/` so a non-technical user can start the backend with a single command.

---
If you'd like the README even shorter (one-page quick cheat sheet for a non-technical person), tell me and I will compress it into a printable checklist.
