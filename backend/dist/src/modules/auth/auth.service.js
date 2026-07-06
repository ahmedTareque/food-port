"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const supabase_js_1 = require("@supabase/supabase-js");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../database/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, config, jwtService) {
        this.prisma = prisma;
        this.config = config;
        this.jwtService = jwtService;
        this.supabase = (0, supabase_js_1.createClient)(config.get('supabase.url') ?? '', config.get('supabase.serviceRoleKey') ?? '');
    }
    isLocalDev() {
        const url = this.config.get('supabase.url') ?? '';
        return url.includes('localhost') || url.includes('127.0.0.1');
    }
    async login(dto) {
        if (this.isLocalDev()) {
            return this.localLogin(dto);
        }
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });
        if (error || !data.session) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const user = await this.prisma.user.findUnique({
            where: { supabase_id: data.user.id },
        });
        if (!user || !user.is_active) {
            throw new common_1.UnauthorizedException('Account not found or disabled');
        }
        return {
            access_token: data.session.access_token,
            user: this.formatUser(user),
        };
    }
    async localLogin(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.is_active) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.password_hash) {
            throw new common_1.UnauthorizedException('Account has no local password — re-run seed');
        }
        const valid = await bcrypt.compare(dto.password, user.password_hash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
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
    async pinLogin(dto) {
        const staffPins = await this.prisma.staffPin.findMany({
            where: { vendor_id: dto.vendor_id, is_active: true },
        });
        let matchedPin = null;
        for (const sp of staffPins) {
            const isMatch = await bcrypt.compare(`pin:${dto.pin}`, sp.pin_hash);
            if (isMatch) {
                matchedPin = sp;
                break;
            }
        }
        if (!matchedPin) {
            throw new common_1.UnauthorizedException('Invalid PIN');
        }
        const vendor = await this.prisma.vendor.findUnique({
            where: { id: dto.vendor_id },
            select: { id: true, name: true },
        });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
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
    async getMe(supabaseId) {
        const user = await this.prisma.user.findUnique({
            where: { supabase_id: supabaseId },
            include: { vendor: { select: { id: true, name: true, booth_number: true } } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.formatUser(user);
    }
    formatUser(user) {
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            vendor_id: user.vendor_id,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map