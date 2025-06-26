
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, 
  List, 
  Search, 
  Filter, 
  Plus, 
  BarChart3,
  Loader2,
  X,
  SlidersHorizontal,
  Download,
  Upload,
  Users,
  UserPlus,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ContactsGridView } from './contacts-grid-view';
import { ContactsListView } from './contacts-list-view';
import { ContactsAnalytics } from './contacts-analytics';
import { EnhancedAddContactModal } from './enhanced-add-contact-modal';

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

interface FilterOptions {
  search: string;
  type: string;
  source: string;
  status: string;
  tags: string[];
  ownerId: string;
  dateRange: string;
}

const contactTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
];

const contactSources = [
  { value: 'all', label: 'All Sources' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'TRADE_SHOW', label: 'Trade Show' },
];

const statusOptions = [
  { value: 'all', label: 'All Contacts' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function ContactsView() {
  const { toast } = useToast();
  
  // State management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // View state
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'analytics'>('grid');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    source: 'all',
    status: 'all',
    tags: [],
    ownerId: 'all',
    dateRange: 'all'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams();
      params.append('limit', '200'); // Increased limit for better UX
      
      if (filters.search) params.append('search', filters.search);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.source !== 'all') params.append('source', filters.source);
      if (filters.ownerId !== 'all') params.append('ownerId', filters.ownerId);
      
      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts');
      }
      
      let filteredContacts = data.data || [];
      
      // Apply client-side filters
      if (filters.status !== 'all') {
        filteredContacts = filteredContacts.filter((contact: Contact) => 
          filters.status === 'active' ? contact.isActive : !contact.isActive
        );
      }
      
      if (filters.tags.length > 0) {
        filteredContacts = filteredContacts.filter((contact: Contact) =>
          filters.tags.some(tag => contact.tags?.includes(tag))
        );
      }
      
      setContacts(filteredContacts);
      
      // Extract available tags
      const tags = new Set<string>();
      filteredContacts.forEach((contact: Contact) => {
        contact.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchContacts();
  }, []);

  // Refresh when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        setRefreshing(true);
        fetchContacts();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      source: 'all',
      status: 'all',
      tags: [],
      ownerId: 'all',
      dateRange: 'all'
    });
  };

  const addTagFilter = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tag] 
      }));
    }
  };

  const removeTagFilter = (tag: string) => {
    setFilters(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t !== tag) 
    }));
  };

  // Contact operations
  const handleContactUpdated = () => {
    fetchContacts();
  };

  const handleContactDeleted = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    setSelectedContacts(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(contactId);
      return newSelected;
    });
  };

  const handleBulkAction = async (action: string) => {
    if (selectedContacts.size === 0) return;
    
    try {
      const contactIds = Array.from(selectedContacts);
      
      const response = await fetch('/api/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, contactIds }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} contacts`);
      }
      
      toast({
        title: "Success",
        description: `${contactIds.length} contact(s) ${action}d successfully`,
      });
      
      setSelectedContacts(new Set());
      fetchContacts();
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${action} contacts`,
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = contacts.length;
    const active = contacts.filter(c => c.isActive).length;
    const leads = contacts.filter(c => c.type === 'LEAD').length;
    const customers = contacts.filter(c => c.type === 'CUSTOMER').length;
    const vendors = contacts.filter(c => c.type === 'VENDOR').length;
    const withDeals = contacts.filter(c => c._count.deals > 0).length;
    
    return { total, active, leads, customers, vendors, withDeals };
  }, [contacts]);

  // Applied filters count
  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type !== 'all') count++;
    if (filters.source !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.tags.length > 0) count += filters.tags.length;
    if (filters.ownerId !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading contacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold mt-1">{stats.active}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium">Leads</span>
          </div>
          <div className="text-2xl font-bold mt-1">{stats.leads}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Customers</span>
          </div>
          <div className="text-2xl font-bold mt-1">{stats.customers}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-sm font-medium">Vendors</span>
          </div>
          <div className="text-2xl font-bold mt-1">{stats.vendors}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">With Deals</span>
          </div>
          <div className="text-2xl font-bold mt-1">{stats.withDeals}</div>
        </div>
      </motion.div>

      {/* Search and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-lg border p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, email, company..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {appliedFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {appliedFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Advanced Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      disabled={appliedFiltersCount === 0}
                    >
                      Clear All
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Source</label>
                      <Select
                        value={filters.source}
                        onValueChange={(value) => handleFilterChange('source', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {contactSources.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {availableTags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {availableTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={filters.tags.includes(tag) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => 
                                filters.tags.includes(tag) 
                                  ? removeTagFilter(tag) 
                                  : addTagFilter(tag)
                              }
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-8" />

            {/* View Toggle */}
            <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="h-8" />

            {/* Actions */}
            <EnhancedAddContactModal onContactCreated={handleContactUpdated}>
              <Button className="bg-orange-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </EnhancedAddContactModal>
          </div>
        </div>

        {/* Active Filters */}
        {appliedFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('search', '')} 
                />
              </Badge>
            )}
            {filters.type !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Type: {contactTypes.find(t => t.value === filters.type)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('type', 'all')} 
                />
              </Badge>
            )}
            {filters.source !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Source: {contactSources.find(s => s.value === filters.source)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('source', 'all')} 
                />
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('status', 'all')} 
                />
              </Badge>
            )}
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                Tag: {tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTagFilter(tag)} 
                />
              </Badge>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedContacts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-card border rounded-lg shadow-lg px-6 py-4 flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
              </span>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('enable')}
                >
                  Enable
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('disable')}
                >
                  Disable
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedContacts(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        {refreshing && (
          <div className="absolute top-4 right-4 z-10 bg-card border rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </div>
          </div>
        )}

        <Tabs value={currentView} className="space-y-6">
          <TabsContent value="grid" className="mt-0">
            <ContactsGridView
              contacts={contacts}
              selectedContacts={selectedContacts}
              onSelectionChange={setSelectedContacts}
              onContactUpdated={handleContactUpdated}
              onContactDeleted={handleContactDeleted}
              loading={refreshing}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <ContactsListView
              contacts={contacts}
              selectedContacts={selectedContacts}
              onSelectionChange={setSelectedContacts}
              onContactUpdated={handleContactUpdated}
              onContactDeleted={handleContactDeleted}
              loading={refreshing}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <ContactsAnalytics contacts={contacts} />
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={() => fetchContacts()}>Try Again</Button>
          </div>
        )}

        {!error && contacts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">No contacts found</div>
            <div className="text-muted-foreground mb-4">
              {appliedFiltersCount > 0 
                ? "Try adjusting your filters or search terms."
                : "Get started by adding your first contact."
              }
            </div>
            {appliedFiltersCount > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <EnhancedAddContactModal onContactCreated={handleContactUpdated}>
                <Button className="bg-orange-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              </EnhancedAddContactModal>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
