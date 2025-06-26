
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Send, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED' | 'EXPIRED';
  className?: string;
}

export function DocumentStatusBadge({ status, className = '' }: DocumentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Draft',
          color: 'text-gray-600'
        };
      case 'SENT':
        return {
          variant: 'default' as const,
          icon: Send,
          label: 'Sent',
          color: 'text-blue-600'
        };
      case 'IN_PROGRESS':
        return {
          variant: 'default' as const,
          icon: UserCheck,
          label: 'In Progress',
          color: 'text-orange-600'
        };
      case 'COMPLETED':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-600'
        };
      case 'VOIDED':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Voided',
          color: 'text-red-600'
        };
      case 'EXPIRED':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          label: 'Expired',
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
