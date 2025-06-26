
"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Calendar,
  BarChart3,
  Tag,
  MessageSquare,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ClientDateOnly } from '@/components/ui/client-date';
import { useToast } from '@/components/ui/use-toast';

interface Contact {
  id: string;
  type: string;
  source?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  tags: string[];
  isActive: boolean;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    deals: number;
    tasks: number;
    appointments: number;
  };
}

interface ContactsGridViewProps {
  contacts: Contact[];
  selectedContacts: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onContactUpdated: () => void;
  onContactDeleted: (contactId: string) => void;
  loading?: boolean;
}

export function ContactsGridView({
  contacts,
  selectedContacts,
  onSelectionChange,
  onContactUpdated,
  onContactDeleted,
  loading = false
}: ContactsGridViewProps) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleContactSelect = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    onSelectionChange(newSelected);
  };

  const handleToggleStatus = async (contactId: string, newStatus: boolean) => {
    try {
      setActionLoading(contactId);
      
      const response = await fetch(`/api/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contact status');
      }
      
      toast({
        title: "Success",
        description: `Contact ${newStatus ? 'enabled' : 'disabled'} successfully`,
      });
      
      onContactUpdated();
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update contact status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      setActionLoading(contactId);
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contact');
      }
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      
      onContactDeleted(contactId);
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete contact",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CUSTOMER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'VENDOR':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'WEBSITE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'REFERRAL':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'COLD_CALL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'MARKETING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'SOCIAL_MEDIA':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'TRADE_SHOW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getEngagementLevel = (contact: Contact) => {
    const dealCount = contact._count.deals;
    const taskCount = contact._count.tasks;
    const appointmentCount = contact._count.appointments;
    const totalActivity = dealCount + taskCount + appointmentCount;
    
    if (totalActivity === 0) return { level: 'New', color: 'bg-gray-500' };
    if (totalActivity < 3) return { level: 'Low', color: 'bg-yellow-500' };
    if (totalActivity < 8) return { level: 'Medium', color: 'bg-blue-500' };
    return { level: 'High', color: 'bg-green-500' };
  };

  if (contacts.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {contacts.map((contact, index) => {
          const engagement = getEngagementLevel(contact);
          const isSelected = selectedContacts.has(contact.id);
          const isLoading = actionLoading === contact.id;
          
          return (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary shadow-md' 
                  : 'border-border hover:border-primary/50'
              } ${!contact.isActive ? 'opacity-75' : ''}`}>
                <CardContent className="p-6">
                  {/* Header with Selection and Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleContactSelect(contact.id, !!checked)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`http://www.josephanzalone.com/images/p35.jpg ${contact.lastName}:1:1}`}
                            alt={`${contact.firstName} ${contact.lastName}`}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold">
                            {getInitials(contact.firstName, contact.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${engagement.color}`} />
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Meeting
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Note
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(contact.id, !contact.isActive)}
                        >
                          {contact.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    {/* Name and Title */}
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      )}
                    </div>

                    {/* Company */}
                    {contact.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{contact.company}</span>
                      </div>
                    )}

                    {/* Contact Details */}
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {(contact.city || contact.state) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            {[contact.city, contact.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTypeColor(contact.type)}>
                        {contact.type.toLowerCase()}
                      </Badge>
                      {contact.source && (
                        <Badge variant="outline" className={getSourceColor(contact.source)}>
                          {contact.source.toLowerCase().replace('_', ' ')}
                        </Badge>
                      )}
                      {!contact.isActive && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Activity Summary */}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <BarChart3 className="h-3 w-3" />
                                <span>{contact._count.deals}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{contact._count.deals} deal(s)</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span>{contact._count.tasks}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{contact._count.tasks} task(s)</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{contact._count.appointments}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{contact._count.appointments} appointment(s)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`w-2 h-2 rounded-full ${engagement.color}`} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Engagement: {engagement.level}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {contact.lastContactedAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          <span>Last contact: </span>
                          <ClientDateOnly date={contact.lastContactedAt} fallback="Loading..." />
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      {contact.phone && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => window.open(`tel:${contact.phone}`)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Call {contact.firstName}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {contact.email && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => window.open(`mailto:${contact.email}`)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Email {contact.firstName}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View full profile</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
