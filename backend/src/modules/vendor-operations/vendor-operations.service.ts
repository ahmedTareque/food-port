import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { UpdateTransactionDto, CreateFeedbackDto, AdminReviewFeedbackDto } from './dto/vendor-operations.dto';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const TRANSACTION_TYPES = ['rent', 'electricity', 'water', 'other'];
const MONTHLY_LIMITS = { complaint: 5, positive: 5, suggestion: 5 };

@Injectable()
export class VendorOperationsService {
  constructor(private prisma: PrismaService) {}

  private requireVendor(user: JwtUser): string {
    if (!user.vendor_id) throw new ForbiddenException('Vendor account required');
    return user.vendor_id;
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  async getTransactions(user: JwtUser, month?: string) {
    const vendorId = this.requireVendor(user);
    const m = month ?? currentMonth();

    // Ensure all 4 transaction types exist for this month
    for (const type of TRANSACTION_TYPES) {
      await this.prisma.vendorTransaction.upsert({
        where: { vendor_id_type_month: { vendor_id: vendorId, type, month: m } },
        create: { vendor_id: vendorId, type, month: m },
        update: {},
      });
    }

    return this.prisma.vendorTransaction.findMany({
      where: { vendor_id: vendorId, month: m },
      orderBy: { type: 'asc' },
    });
  }

  async updateTransaction(user: JwtUser, id: string, dto: UpdateTransactionDto) {
    const vendorId = this.requireVendor(user);
    const tx = await this.prisma.vendorTransaction.findUnique({ where: { id } });
    if (!tx || tx.vendor_id !== vendorId) throw new NotFoundException('Transaction not found');

    return this.prisma.vendorTransaction.update({
      where: { id },
      data: {
        is_paid: dto.is_paid,
        amount: dto.amount,
        notes: dto.notes,
        paid_at: dto.is_paid && !tx.paid_at ? new Date() : tx.paid_at,
      },
    });
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  async getFeedback(user: JwtUser, month?: string) {
    const vendorId = this.requireVendor(user);
    const m = month ?? currentMonth();

    const items = await this.prisma.vendorFeedback.findMany({
      where: { vendor_id: vendorId, month: m },
      orderBy: [{ type: 'asc' }, { created_at: 'desc' }],
    });

    const counts = {
      complaint: items.filter((i) => i.type === 'complaint').length,
      positive: items.filter((i) => i.type === 'positive').length,
      suggestion: items.filter((i) => i.type === 'suggestion').length,
    };

    const remaining = {
      complaint: Math.max(0, MONTHLY_LIMITS.complaint - counts.complaint),
      positive: Math.max(0, MONTHLY_LIMITS.positive - counts.positive),
      suggestion: Math.max(0, MONTHLY_LIMITS.suggestion - counts.suggestion),
    };

    return { items, counts, limits: MONTHLY_LIMITS, remaining, month: m };
  }

  async createFeedback(user: JwtUser, dto: CreateFeedbackDto) {
    const vendorId = this.requireVendor(user);
    const m = currentMonth();

    const count = await this.prisma.vendorFeedback.count({
      where: { vendor_id: vendorId, type: dto.type, month: m },
    });

    const limit = MONTHLY_LIMITS[dto.type as keyof typeof MONTHLY_LIMITS];
    if (count >= limit) {
      throw new BadRequestException(`Monthly limit of ${limit} ${dto.type}s reached for ${m}`);
    }

    if (dto.type !== 'complaint' && dto.severity) {
      throw new BadRequestException('Severity only applies to complaints');
    }

    return this.prisma.vendorFeedback.create({
      data: {
        vendor_id: vendorId,
        type: dto.type,
        month: m,
        title: dto.title,
        description: dto.description,
        severity: dto.type === 'complaint' ? (dto.severity ?? 'medium') : null,
      },
    });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminGetAllFeedback(type?: string, status?: string, severity?: string, month?: string) {
    return this.prisma.vendorFeedback.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
        ...(month ? { month } : {}),
      },
      include: {
        vendor: { select: { id: true, name: true, booth_number: true } },
      },
      orderBy: [
        { severity: 'asc' },
        { created_at: 'desc' },
      ],
    });
  }

  async adminReviewFeedback(id: string, dto: AdminReviewFeedbackDto, reviewerName: string) {
    const item = await this.prisma.vendorFeedback.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Feedback not found');

    return this.prisma.vendorFeedback.update({
      where: { id },
      data: {
        status: dto.status,
        admin_note: dto.admin_note,
        reviewed_by: reviewerName,
        reviewed_at: new Date(),
      },
    });
  }

  async adminGetTransactions(month?: string, vendorId?: string) {
    const m = month ?? currentMonth();
    return this.prisma.vendorTransaction.findMany({
      where: {
        month: m,
        ...(vendorId ? { vendor_id: vendorId } : {}),
      },
      include: {
        vendor: { select: { id: true, name: true, booth_number: true } },
      },
      orderBy: [{ vendor_id: 'asc' }, { type: 'asc' }],
    });
  }
}
