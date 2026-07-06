import { Controller, Post, Get, Patch, Body, Param, SetMetadata, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const Public = () => SetMetadata('isPublic', true);

@SkipThrottle({ auth: true, order: true })
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Public()
  @Throttle({ order: { ttl: 60000, limit: 30 } })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  findOne(@Param('orderId') orderId: string) {
    return this.ordersService.findOne(orderId);
  }

  @Public()
  @Get(':orderId/status')
  getStatus(@Param('orderId') orderId: string) {
    return this.ordersService.getStatus(orderId);
  }

  @Public()
  @Get('by-token/:token')
  findByToken(@Param('token') token: string) {
    return this.ordersService.findByToken(parseInt(token, 10));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/cancel')
  cancel(@Param('orderId') orderId: string, @Body() body: { reason?: string }) {
    return this.ordersService.cancel(orderId, body.reason);
  }

  @Public()
  @Post(':orderId/rate')
  rate(
    @Param('orderId') orderId: string,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    if (!rating || rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1-5');
    return this.ordersService.rateOrder(orderId, rating, comment);
  }

  @Public()
  @Get(':orderId/rating')
  getRating(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderRating(orderId);
  }
}
