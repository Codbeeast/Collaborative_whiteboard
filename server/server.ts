import { createServer } from 'http';
import next from 'next';
import { config } from './config/env';
import { SocketServer } from './socket/socketServer';
import RedisManager from './redis/client';
import DatabaseClient from './db/client';
import { SnapshotService } from './services/snapshotService';

const dev = config.nodeEnv !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

async function bootstrap() {
  try {
    console.log(`[Bootstrap]: Starting collaborative whiteboard server in ${config.nodeEnv} mode...`);

    // 1. Initialize databases asynchronously (with graceful fallbacks if docker is booting)
    await RedisManager.init();
    await DatabaseClient.testConnection();

    // 2. Start write-behind snapshot service
    SnapshotService.start();

    // 3. Prepare Next.js application
    await app.prepare();

    // 4. Create Node HTTP server
    const httpServer = createServer((req, res) => {
      handle(req, res);
    });

    // 5. Attach WebSocket gateway to HTTP server
    SocketServer.init(httpServer);

    // 6. Listen on configured port
    httpServer.listen(config.port, () => {
      console.log(`> Ready on http://localhost:${config.port}`);
      console.log(`> WebSockets active at ws://localhost:${config.port}/api/socket`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\n[Shutdown]: Gracefully shutting down server...');
      await SnapshotService.flushDirtyBoards();
      SnapshotService.stop();
      await DatabaseClient.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Bootstrap Error]: Fatal server startup failure:', err);
    process.exit(1);
  }
}

bootstrap();
