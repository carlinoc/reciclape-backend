import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// ALTO-02 FIX: CORS usa ALLOWED_ORIGINS (misma variable que el CORS HTTP en main.ts).
// Antes usaba FRONTEND_URL — si esa variable no existía en el VPS, caía a
// localhost:3000 y el panel del mapa no podía conectarse en producción.
@WebSocketGateway({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3001')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
  },
  namespace: 'trucks',
})
export class TruckPositionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // BAJO-01 FIX: Logger de NestJS en lugar de console.log.
  // En producción los logs tienen nivel, timestamp y contexto — no ruido en stdout.
  private readonly logger = new Logger(TruckPositionsGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Cliente conectado: ${client.id}`);
    // Suscribir solo a camiones específicos solicitados por el cliente
    const truckIds = client.handshake.query.trucks as string;
    if (truckIds) {
      truckIds.split(',').forEach(id => client.join(`truck:${id}`));
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
  }

  // Emite la posición SOLO a los clientes suscritos al camión específico
  emitTruckMovement(positionData: any) {
    this.server
      .to(`truck:${positionData.truckId}`)
      .emit('positionUpdate', positionData);
  }
}