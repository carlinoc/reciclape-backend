import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // En producción, limita esto a tu dominio
  namespace: 'trucks',
})
export class TruckPositionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    // Suscribir solo a camiones específicos
    const truckIds = client.handshake.query.trucks as string;
    if (truckIds) {
      truckIds.split(',').forEach(id => client.join(`truck:${id}`));
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Método para emitir la posición a todos los conectados
  emitTruckMovement(positionData: any) {
    // Emitir solo a room específica
    this.server
      .to(`truck:${positionData.truckId}`)
      .emit('positionUpdate', positionData);
      
    // Broadcast global para mapas generales (opcional)
    this.server.emit('positionUpdate', positionData);
  }
}