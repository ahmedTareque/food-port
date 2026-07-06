import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {
    this.supabase = createClient(
      config.get<string>('supabase.url') ?? '',
      config.get<string>('supabase.serviceRoleKey') ?? '',
    );
  }

  private isLocalDev(): boolean {
    const url = this.config.get<string>('supabase.url') ?? '';
    return url.includes('localhost') || url.includes('127.0.0.1');
  }

  async login(dto: LoginDto) {
    if (this.isLocalDev()) {
      return this.localLogin(dto);
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.prisma.user.findUnique({
      where: { supabase_id: data.user.id },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Account not found or disabled');
    }

    return {
      access_token: data.session.access_token,
      user: this.formatUser(user),
    };
  }

  private async localLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Account has no local password — re-run seed');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.supabase_id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated',
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '24h' });

    return {
      access_token,
      user: this.formatUser(user),
    };
  }

  async pinLogin(dto: PinLoginDto) {
    const staffPins = await this.prisma.staffPin.findMany({
      where: { vendor_id: dto.vendor_id, is_active: true },
    });

    let matchedPin: typeof staffPins[0] | null = null;
    for (const sp of staffPins) {
      const isMatch = await bcrypt.compare(`pin:${dto.pin}`, sp.pin_hash);
      if (isMatch) { matchedPin = sp; break; }
    }

    if (!matchedPin) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendor_id },
      select: { id: true, name: true },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    const staff = {
      pin_id: matchedPin.id,
      vendor_id: dto.vendor_id,
      vendor_name: vendor.name,
      role: matchedPin.role,
      label: matchedPin.label,
    };

    const payload = {
      sub: `pin:${matchedPin.id}`,
      vendor_id: dto.vendor_id,
      role: 'authenticated',
      aud: 'authenticated',
    };
    const access_token = this.jwtService.sign(payload, { expiresIn: '12h' });

    return { access_token, staff };
  }

  async getMe(supabaseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabase_id: supabaseId },
      include: { vendor: { select: { id: true, name: true, booth_number: true } } },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.formatUser(user);
  }

  private formatUser(user: { id: string; email: string; full_name: string; role: string; vendor_id: string | null }) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      vendor_id: user.vendor_id,
    };
  }
}
