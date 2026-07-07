'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export default function FontProvider() {
  const font = useUIStore((s) => s.font);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', font);
  }, [font]);

  return null;
}
