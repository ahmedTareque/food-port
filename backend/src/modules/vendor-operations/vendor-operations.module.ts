import { Module } from '@nestjs/common';
import { VendorOperationsController } from './vendor-operations.controller';
import { VendorOperationsService } from './vendor-operations.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [VendorOperationsController],
  providers: [VendorOperationsService, PrismaService],
  exports: [VendorOperationsService],
})
export class VendorOperationsModule {}
