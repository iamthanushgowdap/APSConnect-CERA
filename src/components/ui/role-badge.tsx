"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
  showAlumni?: boolean;
}

export function RoleBadge({ role, size = 'md', showAlumni = true }: RoleBadgeProps) {
  const isAlumni = role === 'alumni';

  if (isAlumni && !showAlumni) return null;

  const badgeProps = {
    variant: role === 'admin' ? 'destructive' as const :
             role === 'faculty' ? 'secondary' as const :
             (isAlumni ? 'default' as const : 'outline' as const),
    className: `${size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} capitalize mr-2 ${
      isAlumni ? 'bg-blue-600 text-white' : ''
    }`
  };

  return <Badge {...badgeProps}>{role}</Badge>;
}
