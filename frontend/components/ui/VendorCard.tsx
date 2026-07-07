'use client';
import { useState } from 'react';
import Image from 'next/image';

interface VendorCardProps {
  variant: 'photo' | 'white';
  name: string;
  cuisine: string;
  prepTimeMinutes?: number;
  boothNumber: number;
  isOpen: boolean;
  onOrder?: () => void;
  orderLabel?: string;
  className?: string;
  footer?: React.ReactNode;
}

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-none">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-none">
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-[22px] h-[22px]" fill={filled ? '#ec5b6a' : 'none'} stroke={filled ? '#ec5b6a' : 'currentColor'}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export default function VendorCard({
  variant,
  name,
  cuisine,
  prepTimeMinutes,
  boothNumber,
  isOpen,
  onOrder,
  orderLabel = 'Order now',
  className = '',
  footer,
}: VendorCardProps) {
  const [saved, setSaved] = useState(false);

  const meta = (
    <div className="flex items-center gap-5 text-[13px]">
      {prepTimeMinutes != null && (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <ClockIcon />
          ~{prepTimeMinutes}m
        </span>
      )}
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <TagIcon />
        <span className="font-bold">B{boothNumber}</span>
      </span>
      <span
        className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isOpen ? 'bg-brand-primary-light text-emerald-700' : 'bg-brand-danger-light text-red-600'
        } ${variant === 'photo' ? '!bg-white/25 !text-white backdrop-blur-sm' : ''}`}
      >
        {isOpen ? 'OPEN' : 'CLOSED'}
      </span>
    </div>
  );

  if (variant === 'photo') {
    return (
      <article className={`rounded-[32px] overflow-hidden bg-white shadow-[0_20px_40px_-20px_rgba(20,22,30,.35)] flex flex-col ${className}`}>
        <div className="relative aspect-[372/460] flex-none">
          <Image src="/images/waffles.jpg" alt={name} fill sizes="400px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/25 to-black/85" />

          <button
            onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); }}
            aria-label={`Save ${name}`}
            aria-pressed={saved}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center hover:bg-white/35 active:scale-90 transition-all"
          >
            <span className="text-white [&_svg]:stroke-white">
              <HeartIcon filled={saved} />
            </span>
          </button>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h3 className="text-2xl font-extrabold tracking-tight leading-tight">{name}</h3>
            <p className="text-sm text-white/80 mt-1">{cuisine}</p>
            <div className="mt-4 text-white [&_svg]:stroke-white">{meta}</div>
            {onOrder && (
              <button
                onClick={onOrder}
                className="mt-4 w-full h-12 rounded-full bg-white text-brand-white text-sm font-semibold shadow-[0_10px_24px_-10px_rgba(0,0,0,.5)] hover:bg-gray-100 active:scale-[.98] transition-all"
              >
                {orderLabel}
              </button>
            )}
          </div>
        </div>
        {footer && <div className="p-5 pt-0">{footer}</div>}
      </article>
    );
  }

  return (
    <article className={`rounded-[32px] bg-white shadow-[0_20px_40px_-20px_rgba(20,22,30,.28)] p-3 flex flex-col ${className}`}>
      <div className="rounded-[22px] overflow-hidden aspect-[344/260] relative">
        <Image src="/images/waffles.jpg" alt={name} fill sizes="400px" className="object-cover" />
      </div>
      <div className="pt-4 px-1 flex flex-col flex-1">
        <h3 className="text-xl font-extrabold tracking-tight text-brand-white leading-tight">{name}</h3>
        <p className="text-sm text-brand-chrome mt-1">{cuisine}</p>
        <div className="mt-4 text-brand-chrome [&_svg]:stroke-brand-chrome">{meta}</div>

        {footer}

        {onOrder && (
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={onOrder}
              className="flex-1 h-12 rounded-full bg-brand-white text-white text-sm font-semibold hover:bg-black transition-colors active:scale-[.98]"
            >
              {orderLabel}
            </button>
            <button
              onClick={() => setSaved((s) => !s)}
              aria-label={`Save ${name}`}
              aria-pressed={saved}
              className="w-12 h-12 flex-none rounded-full bg-white border-[1.5px] border-brand-border flex items-center justify-center hover:border-black/20 active:scale-90 transition-all"
            >
              <HeartIcon filled={saved} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
