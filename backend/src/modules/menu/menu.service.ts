import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getVendors(status?: string) {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        status: status === 'active' ? 'online' : undefined,
        ...(status === 'active' ? {} : { status: { not: 'suspended' } }),
      },
      orderBy: { booth_number: 'asc' },
    });

    return vendors.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      logo_url: v.logo_url,
      cuisine_type: v.cuisine_type,
      booth_number: v.booth_number,
      booth_color: v.booth_color,
      avg_prep_time_minutes: v.avg_prep_time_minutes,
      status: v.status,
      is_accepting_orders: v.is_accepting_orders,
    }));
  }

  async getVendorMenu(vendorId: string, available?: boolean) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const categories = await this.prisma.menuCategory.findMany({
      where: { vendor_id: vendorId, is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        items: {
          where: {
            is_deleted: false,
            ...(available !== false ? { is_available: true } : {}),
          },
          orderBy: { sort_order: 'asc' },
          include: {
            modifier_group_links: {
              include: { modifier_group: { include: { modifiers: { where: { is_available: true }, orderBy: { sort_order: 'asc' } } } } },
            },
          },
        },
      },
    });

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        logo_url: vendor.logo_url,
        cuisine_type: vendor.cuisine_type,
        booth_number: vendor.booth_number,
        booth_color: vendor.booth_color,
        avg_prep_time_minutes: vendor.avg_prep_time_minutes,
        status: vendor.status,
        is_accepting_orders: vendor.is_accepting_orders,
      },
      categories: categories.map((cat) => ({
        category: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          sort_order: cat.sort_order,
          item_count: cat.items.length,
        },
        items: cat.items.map((item) => this.formatMenuItem(item)),
      })),
    };
  }

  async getMenuItemDetail(itemId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, is_deleted: false },
      include: {
        modifier_group_links: {
          include: {
            modifier_group: {
              include: {
                modifiers: { where: { is_available: true }, orderBy: { sort_order: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Menu item not found');
    return this.formatMenuItemDetail(item);
  }

  async validatePromoCode(code: string, subtotal: number) {
    const now = new Date();
    const promo = await this.prisma.promotion.findFirst({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        valid_from: { lte: now },
        valid_to: { gte: now },
      },
    });

    if (!promo) throw new BadRequestException('Invalid or expired promo code');

    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    if (promo.min_order_amount !== null && subtotal < promo.min_order_amount) {
      throw new BadRequestException(`Minimum order amount $${promo.min_order_amount.toFixed(2)} required`);
    }

    const discount =
      promo.type === 'percent'
        ? Math.min(subtotal * (promo.value / 100), subtotal)
        : Math.min(promo.value, subtotal);

    return {
      promotion_id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount_amount: parseFloat(discount.toFixed(2)),
    };
  }

  async getVendorCategories(vendorId: string) {
    const categories = await this.prisma.menuCategory.findMany({
      where: { vendor_id: vendorId, is_active: true },
      include: { _count: { select: { items: { where: { is_deleted: false } } } } },
      orderBy: { sort_order: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sort_order: c.sort_order,
      item_count: c._count.items,
    }));
  }

  private formatMenuItem(item: {
    id: string; name: string; description: string | null; price: number;
    image_url: string | null; thumbnail_url: string | null; prep_time_minutes: number;
    dietary_tags: string[]; allergens: string[]; is_available: boolean;
    modifier_group_links: { modifier_group: { id: string } }[];
    category_id: string;
  }) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url,
      prep_time_minutes: item.prep_time_minutes,
      dietary_tags: item.dietary_tags,
      allergens: item.allergens,
      is_available: item.is_available,
      has_modifiers: item.modifier_group_links.length > 0,
      category_id: item.category_id,
    };
  }

  private formatMenuItemDetail(item: {
    id: string; name: string; description: string | null; price: number;
    image_url: string | null; thumbnail_url: string | null; prep_time_minutes: number;
    dietary_tags: string[]; allergens: string[]; is_available: boolean;
    category_id: string;
    modifier_group_links: Array<{
      modifier_group: {
        id: string; name: string; is_required: boolean;
        min_selections: number; max_selections: number;
        modifiers: Array<{ id: string; name: string; price_adjustment: number; is_available: boolean }>;
      };
    }>;
  }) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url,
      prep_time_minutes: item.prep_time_minutes,
      dietary_tags: item.dietary_tags,
      allergens: item.allergens,
      is_available: item.is_available,
      has_modifiers: item.modifier_group_links.length > 0,
      category_id: item.category_id,
      modifier_groups: item.modifier_group_links.map(({ modifier_group: mg }) => ({
        id: mg.id,
        name: mg.name,
        is_required: mg.is_required,
        min_selections: mg.min_selections,
        max_selections: mg.max_selections,
        modifiers: mg.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          price_adjustment: m.price_adjustment,
          is_available: m.is_available,
        })),
      })),
    };
  }
}
