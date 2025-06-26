
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

interface SignerStatusBadgeProps {
  status: 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
  className?: string;
}

export function SignerStatusBadge({ status, className = '' }: SignerStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Pending',
          color: 'text-gray-600'
        };
      case 'SENT':
        return {
          variant: 'default' as const,
          icon: Send,
          label: 'Sent',
          color: 'text-blue-600'
        };
      case 'VIEWED':
        return {
          variant: 'default' as const,
          icon: Eye,
          label: 'Viewed',
          color: 'text-orange-600'
        };
      case 'SIGNED':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Signed',
          color: 'text-green-600'
        };
      case 'DECLINED':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Declined',
          color: 'text-red-600'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: status,
          color: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
