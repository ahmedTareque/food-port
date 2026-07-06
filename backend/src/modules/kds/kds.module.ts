import { Module } from '@nestjs/common';
import { KdsController } from './kds.controller';
import { KdsService } from './kds.service';
import { KdsGateway } from './kds.gateway';
import { PrismaService } from '../../database/prisma.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [KdsController],
  providers: [KdsService, KdsGateway, PrismaService],
  exports: [KdsGateway],
})
export class KdsModule {}
