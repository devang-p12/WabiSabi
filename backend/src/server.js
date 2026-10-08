import "dotenv/config";
import app from "./app.js";
import http from "http";
import { initSocket } from "./socket.js";
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server);
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map