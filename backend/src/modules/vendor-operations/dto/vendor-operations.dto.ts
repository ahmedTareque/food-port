import { IsString, IsBoolean, IsOptional, IsNumber, IsIn, IsDateString, MaxLength } from 'class-validator';

const TRANSACTION_TYPES = ['rent', 'electricity', 'water', 'other'] as const;
const FEEDBACK_TYPES = ['complaint', 'positive', 'suggestion'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export class UpdateTransactionDto {
  @IsBoolean()
  is_paid: boolean;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFeedbackDto {
  @IsString()
  @IsIn(FEEDBACK_TYPES)
  type: string;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsString()
  @IsIn(SEVERITIES)
  severity?: string;
}

export class AdminReviewFeedbackDto {
  @IsString()
  @IsIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  admin_note?: string;
}
