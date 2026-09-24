import http from "http";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

dotenv.config({
  path: "../../packages/database/.env",
});

const { default: app } = await import("./server.js");
const { attachIdeasSocket } = await import("./ws/ideas.socket.js");

const PORT = process.env.PORT || 7000;

// A real HTTP server (not app.listen) so the Ideas WebSocket can share the port.
const server = http.createServer(app);
attachIdeasSocket(server);

server.listen(PORT, () => {
  console.log(`CanIClone API running on http://localhost:${PORT}`);
  console.log(`CanIClone Ideas WebSocket on ws://localhost:${PORT}/ws`);
});
