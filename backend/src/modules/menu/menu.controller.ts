import { Controller, Get, Post, Body, Param, Query, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { MenuService } from './menu.service';

const Public = () => SetMetadata('isPublic', true);

@SkipThrottle({ auth: true, order: true })
@ApiTags('Menu')
@Controller()
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Public()
  @Get('vendors')
  @ApiQuery({ name: 'status', required: false })
  getVendors(@Query('status') status?: string) {
    return this.menuService.getVendors(status);
  }

  @Public()
  @Get('vendors/:vendorId/menu')
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  getVendorMenu(
    @Param('vendorId') vendorId: string,
    @Query('available') available?: string,
  ) {
    const availableBool = available === undefined ? true : available !== 'false';
    return this.menuService.getVendorMenu(vendorId, availableBool);
  }

  @Public()
  @Get('vendors/:vendorId/categories')
  getVendorCategories(@Param('vendorId') vendorId: string) {
    return this.menuService.getVendorCategories(vendorId);
  }

  @Public()
  @Get('menu-items/:itemId')
  getMenuItemDetail(@Param('itemId') itemId: string) {
    return this.menuService.getMenuItemDetail(itemId);
  }

  @Public()
  @Post('promos/validate')
  validatePromo(@Body() body: { code: string; subtotal: number }) {
    return this.menuService.validatePromoCode(body.code, body.subtotal);
  }
}
