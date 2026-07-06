import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/kds',
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const vendorId = client.handshake.query.vendor_id as string;
    if (vendorId) {
      client.join(`vendor:${vendorId}`);
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('join_vendor')
  handleJoin(@MessageBody() data: { vendor_id: string }, @ConnectedSocket() client: Socket) {
    client.join(`vendor:${data.vendor_id}`);
  }

  emitNewOrder(vendorId: string, order: unknown) {
    this.server.to(`vendor:${vendorId}`).emit('new_order', order);
  }

  emitOrderUpdate(vendorId: string, update: unknown) {
    this.server.to(`vendor:${vendorId}`).emit('order_update', update);
  }
}
