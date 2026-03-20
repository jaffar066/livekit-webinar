# LiveKit Webinar

A simple LiveKit webinar demo with a token server backend and a frontend app.

## Project structure

```
livekit-webinar/
├── backend/    # Express token server that creates LiveKit tokens
│   ├── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
``` 

## Running the backend

1) Install dependencies:

```bash
cd backend
npm install
```

2) Start the dev server:

```bash
npm run dev
```

Server runs at `http://localhost:3001`.

## How it works

The backend exposes `/get-token` which mint short-lived LiveKit tokens. The token contains simple role-based permissions:

- **Host**: can publish audio/video
- **Cohost**: can publish audio/video
- **Viewer**: can only subscribe

The first participant to join a room is automatically set as host.

---

For a complete example with frontend UI, see the `livekit-frontend` sample in the sibling folder.
