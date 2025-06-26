
"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Building, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  ChevronDown,
  ChevronRight,
  Calendar,
  MessageSquare,
  BarChart3,
  Clock,
  MapPin,
  ExternalLink,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface ContactsListViewProps {
  contacts: Contact[];
  selectedContacts: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onContactUpdated: () => void;
  onContactDeleted: (contactId: string) => void;
  loading?: boolean;
}

type SortField = 'name' | 'company' | 'type' | 'lastContact' | 'created' | 'activity';
type SortDirection = 'asc' | 'desc';

export function ContactsListView({
  contacts,
  selectedContacts,
  onSelectionChange,
  onContactUpdated,
  onContactDeleted,
  loading = false
}: ContactsListViewProps) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleContactSelect = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(contacts.map(c => c.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleRowExpand = (contactId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const sortedContacts = React.useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (sortField) {
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'company':
          valueA = (a.company || '').toLowerCase();
          valueB = (b.company || '').toLowerCase();
          break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        case 'lastContact':
          valueA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
          valueB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
          break;
        case 'created':
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
        case 'activity':
          valueA = a._count.deals + a._count.tasks + a._count.appointments;
          valueB = b._count.deals + b._count.tasks + b._count.appointments;
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [contacts, sortField, sortDirection]);

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
    const totalActivity = contact._count.deals + contact._count.tasks + contact._count.appointments;
    if (totalActivity === 0) return { level: 'New', color: 'bg-gray-500', percentage: 0 };
    if (totalActivity < 3) return { level: 'Low', color: 'bg-yellow-500', percentage: 25 };
    if (totalActivity < 8) return { level: 'Medium', color: 'bg-blue-500', percentage: 60 };
    return { level: 'High', color: 'bg-green-500', percentage: 100 };
  };

  const allSelected = contacts.length > 0 && selectedContacts.size === contacts.length;
  const partialSelected = selectedContacts.size > 0 && selectedContacts.size < contacts.length;

  if (contacts.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all contacts"
                    {...(partialSelected && { 'data-state': 'indeterminate' })}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="min-w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Contact
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('company')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Company
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('type')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('activity')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Activity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('lastContact')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Last Contact
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContacts.map((contact) => {
                const isSelected = selectedContacts.has(contact.id);
                const isExpanded = expandedRows.has(contact.id);
                const isLoading = actionLoading === contact.id;
                const engagement = getEngagementLevel(contact);
                
                return (
                  <React.Fragment key={contact.id}>
                    <TableRow 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        isSelected ? 'bg-muted/30' : ''
                      } ${!contact.isActive ? 'opacity-75' : ''}`}
                      onClick={() => handleRowExpand(contact.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleContactSelect(contact.id, !!checked)}
                          aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-auto p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://i.pinimg.com/originals/27/7b/38/277b385c3f54587ea32797807fe44b0c.jpg ${contact.lastName}:1:1}`}
                                alt={`${contact.firstName} ${contact.lastName}`}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold text-xs">
                                {getInitials(contact.firstName, contact.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background ${engagement.color}`} />
                          </div>
                          <div>
                            <div className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </div>
                            {contact.title && (
                              <div className="text-sm text-muted-foreground">{contact.title}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {contact.company || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge className={getTypeColor(contact.type)}>
                            {contact.type.toLowerCase()}
                          </Badge>
                          {contact.source && (
                            <Badge variant="outline" className={getSourceColor(contact.source)}>
                              {contact.source.toLowerCase().replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-40">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  {contact._count.deals}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{contact._count.deals} deal(s)</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {contact._count.tasks}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{contact._count.tasks} task(s)</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {contact._count.appointments}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{contact._count.appointments} appointment(s)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${engagement.color}`}
                              style={{ width: `${engagement.percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {contact.lastContactedAt ? (
                            <ClientDateOnly 
                              date={contact.lastContactedAt}
                              fallback="Loading..."
                            />
                          ) : (
                            'Never'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                          {contact.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isLoading}>
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
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={10} className="p-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-muted/30 border-t"
                            >
                              <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Contact Details */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                      Contact Details
                                    </h4>
                                    <div className="space-y-2">
                                      {contact.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <span>{contact.email}</span>
                                          <Button size="sm" variant="ghost" className="h-auto p-0 ml-auto">
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                      {contact.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span>{contact.phone}</span>
                                          <Button size="sm" variant="ghost" className="h-auto p-0 ml-auto">
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                      {(contact.address || contact.city || contact.state) && (
                                        <div className="flex items-start gap-2 text-sm">
                                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div>
                                            {contact.address && <div>{contact.address}</div>}
                                            {(contact.city || contact.state) && (
                                              <div>
                                                {[contact.city, contact.state, contact.zipCode].filter(Boolean).join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tags and Company */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                      Additional Info
                                    </h4>
                                    <div className="space-y-2">
                                      {contact.company && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Building className="h-4 w-4 text-muted-foreground" />
                                          <span>{contact.company}</span>
                                        </div>
                                      )}
                                      {contact.tags && contact.tags.length > 0 && (
                                        <div>
                                          <div className="flex items-center gap-2 text-sm mb-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Tags</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {contact.tags.map((tag) => (
                                              <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Created</span>
                                        <ClientDateOnly date={contact.createdAt} fallback="Loading..." />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                      Quick Actions
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {contact.phone && (
                                        <Button size="sm" variant="outline" className="justify-start">
                                          <Phone className="h-4 w-4 mr-2" />
                                          Call
                                        </Button>
                                      )}
                                      {contact.email && (
                                        <Button size="sm" variant="outline" className="justify-start">
                                          <Mail className="h-4 w-4 mr-2" />
                                          Email
                                        </Button>
                                      )}
                                      <Button size="sm" variant="outline" className="justify-start">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Schedule
                                      </Button>
                                      <Button size="sm" variant="outline" className="justify-start">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Note
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
