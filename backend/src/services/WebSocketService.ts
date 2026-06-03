import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { OrganismService } from "./OrganismService.js";
import { corsOriginDelegate } from "../lib/corsOrigins.js";
import { ClientToServerEvents, ServerToClientEvents } from "../types/index.js";
import { isPaymentGateActive } from "../lib/requirePayments.js";

interface InterServerEvents {}
interface SocketData {
  sessionId: string;
  username: string;
}

export class WebSocketService {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private onlineUsers: Map<string, { username: string; connectedAt: Date }> = new Map();
  private broadcastThrottle: NodeJS.Timeout | null = null;

  constructor(httpServer: HttpServer, private organism: OrganismService) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOriginDelegate,
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    organism.setbroadcaster((event, data) => {
      this.io.emit(event as keyof ServerToClientEvents, data as never);
    });

    this.setupHandlers();
    this.startStateBroadcast();
  }

  private setupHandlers() {
    this.io.on("connection", (socket) => {
      const sessionId = socket.handshake.query.sessionId as string ?? socket.id;
      socket.data.sessionId = sessionId;
      socket.data.username = "Anonymous";

      this.onlineUsers.set(sessionId, {
        username: "Anonymous",
        connectedAt: new Date(),
      });

      this.broadcastOnlineCount();

      socket.on("water", async (data) => {
        if (isPaymentGateActive()) {
          socket.emit("payment_required", { action: "water" });
          return;
        }
        try {
          const username = data.username?.trim() || "Anonymous";
          socket.data.username = username;
          const entry = this.onlineUsers.get(sessionId);
          if (entry) entry.username = username;

          const state = await this.organism.water(username, sessionId);
          this.io.emit("organism_state", state);
        } catch (err) {
          console.error("[WS] water error:", err);
        }
      });

      socket.on("add_leaf", async (data) => {
        if (isPaymentGateActive()) {
          socket.emit("payment_required", { action: "leaf" });
          return;
        }
        try {
          const username = data.username?.trim() || "Anonymous";
          socket.data.username = username;
          await this.organism.addLeaf(username, sessionId);
        } catch (err) {
          console.error("[WS] add_leaf error:", err);
        }
      });

      socket.on("post_comment", async (data) => {
        if (isPaymentGateActive()) {
          socket.emit("payment_required", { action: "comment" });
          return;
        }
        try {
          const username = data.username?.trim() || "Anonymous";
          const message = data.message?.trim() ?? "";
          socket.data.username = username;
          const entry = this.onlineUsers.get(sessionId);
          if (entry) entry.username = username;
          await this.organism.postComment(username, message);
        } catch (err) {
          console.error("[WS] post_comment error:", err);
        }
      });

      socket.on("ping", () => {
        socket.emit("online_count", this.onlineUsers.size);
      });

      socket.on("disconnect", () => {
        this.onlineUsers.delete(sessionId);
        this.broadcastOnlineCount();
      });

      this.sendInitialState(socket);
    });
  }

  private async sendInitialState(socket: Socket) {
    try {
      const [state, leaves] = await Promise.all([
        this.organism.getState(),
        this.organism.getLeaves(),
      ]);
      socket.emit("organism_state", state);
      socket.emit("leaves_update", leaves);
      socket.emit("online_count", this.onlineUsers.size);
    } catch (err) {
      console.error("[WS] initial state error:", err);
    }
  }

  private broadcastOnlineCount() {
    if (this.broadcastThrottle) clearTimeout(this.broadcastThrottle);
    this.broadcastThrottle = setTimeout(() => {
      this.io.emit("online_count", this.onlineUsers.size);
    }, 500);
  }

  private startStateBroadcast() {
    setInterval(async () => {
      try {
        const state = await this.organism.getState();
        this.io.emit("organism_state", state);
      } catch (err) {
        console.error("[WS] state broadcast error:", err);
      }
    }, 5000);
  }

  getOnlineCount(): number {
    return this.onlineUsers.size;
  }
}
