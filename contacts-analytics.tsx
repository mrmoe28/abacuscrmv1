
"use client"

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Mail,
  Phone,
  Building,
  Target,
  Award,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

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

interface ContactsAnalyticsProps {
  contacts: Contact[];
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3', '#72BF78', '#FFD93D'];

export function ContactsAnalytics({ contacts }: ContactsAnalyticsProps) {
  
  // Calculate contact type distribution
  const typeDistribution = useMemo(() => {
    const types = contacts.reduce((acc, contact) => {
      acc[contact.type] = (acc[contact.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(types).map(([type, count]) => ({
      name: type.toLowerCase(),
      value: count,
      percentage: ((count / contacts.length) * 100).toFixed(1)
    }));
  }, [contacts]);

  // Calculate source distribution
  const sourceDistribution = useMemo(() => {
    const sources = contacts.reduce((acc, contact) => {
      const source = contact.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(sources).map(([source, count]) => ({
      name: source.toLowerCase().replace('_', ' '),
      value: count,
      percentage: ((count / contacts.length) * 100).toFixed(1)
    }));
  }, [contacts]);

  // Calculate monthly contact creation trend
  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        fullDate: new Date(date.getFullYear(), date.getMonth(), 1)
      };
    }).reverse();
    
    return months.map(({ month, fullDate }) => {
      const count = contacts.filter(contact => {
        const contactDate = new Date(contact.createdAt);
        return contactDate.getMonth() === fullDate.getMonth() && 
               contactDate.getFullYear() === fullDate.getFullYear();
      }).length;
      
      return { month, contacts: count };
    });
  }, [contacts]);

  // Calculate engagement metrics
  const engagementMetrics = useMemo(() => {
    const totalContacts = contacts.length;
    const activeContacts = contacts.filter(c => c.isActive).length;
    const contactsWithDeals = contacts.filter(c => c._count.deals > 0).length;
    const contactsWithRecentActivity = contacts.filter(c => 
      c.lastContactedAt && 
      new Date(c.lastContactedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      total: totalContacts,
      active: activeContacts,
      withDeals: contactsWithDeals,
      recentActivity: contactsWithRecentActivity,
      conversionRate: totalContacts > 0 ? ((contactsWithDeals / totalContacts) * 100).toFixed(1) : '0',
      activeRate: totalContacts > 0 ? ((activeContacts / totalContacts) * 100).toFixed(1) : '0',
      engagementRate: totalContacts > 0 ? ((contactsWithRecentActivity / totalContacts) * 100).toFixed(1) : '0'
    };
  }, [contacts]);

  // Top performers (owners with most contacts)
  const topPerformers = useMemo(() => {
    const ownerStats = contacts.reduce((acc, contact) => {
      const ownerId = contact.owner.id;
      if (!acc[ownerId]) {
        acc[ownerId] = {
          name: contact.owner.name,
          email: contact.owner.email,
          contacts: 0,
          deals: 0,
          activeContacts: 0
        };
      }
      acc[ownerId].contacts++;
      acc[ownerId].deals += contact._count.deals;
      if (contact.isActive) acc[ownerId].activeContacts++;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(ownerStats)
      .sort((a: any, b: any) => b.contacts - a.contacts)
      .slice(0, 5);
  }, [contacts]);

  // Activity distribution
  const activityDistribution = useMemo(() => {
    const ranges = [
      { label: 'No Activity', min: 0, max: 0, count: 0 },
      { label: 'Low (1-2)', min: 1, max: 2, count: 0 },
      { label: 'Medium (3-7)', min: 3, max: 7, count: 0 },
      { label: 'High (8+)', min: 8, max: Infinity, count: 0 }
    ];
    
    contacts.forEach(contact => {
      const totalActivity = contact._count.deals + contact._count.tasks + contact._count.appointments;
      const range = ranges.find(r => totalActivity >= r.min && totalActivity <= r.max);
      if (range) range.count++;
    });
    
    return ranges.filter(r => r.count > 0);
  }, [contacts]);

  // Most common tags
  const topTags = useMemo(() => {
    const tagCounts = contacts.reduce((acc, contact) => {
      contact.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [contacts]);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, description, color = "blue" }: any) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
            <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-300`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trendValue}%
            </span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Contacts"
          value={engagementMetrics.total}
          icon={Users}
          description="All contacts in database"
          color="blue"
        />
        <StatCard
          title="Active Contacts"
          value={`${engagementMetrics.active} (${engagementMetrics.activeRate}%)`}
          icon={UserCheck}
          description="Currently active contacts"
          color="green"
        />
        <StatCard
          title="With Deals"
          value={`${engagementMetrics.withDeals} (${engagementMetrics.conversionRate}%)`}
          icon={Target}
          description="Contacts with active deals"
          color="orange"
        />
        <StatCard
          title="Recent Activity"
          value={`${engagementMetrics.recentActivity} (${engagementMetrics.engagementRate}%)`}
          icon={Activity}
          description="Active in last 30 days"
          color="purple"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Contact Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percentage }: { name: string; percentage: string }) => `${name} ${percentage}%`}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Source Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contact Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Trend and Activity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Contact Creation Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-[350px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Contact Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="contacts" 
                    stroke={COLORS[1]} 
                    fill={COLORS[1]} 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-[350px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Engagement Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.email} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-sm text-muted-foreground">{performer.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{performer.contacts}</div>
                      <div className="text-sm text-muted-foreground">contacts</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topTags.map((tag, index) => (
                  <div key={tag.tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{tag.tag}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(tag.count / Math.max(...topTags.map(t => t.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{tag.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Email Contacts</p>
                <p className="text-2xl font-bold">
                  {contacts.filter(c => c.email).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((contacts.filter(c => c.email).length / contacts.length) * 100).toFixed(1)}% have email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Phone Contacts</p>
                <p className="text-2xl font-bold">
                  {contacts.filter(c => c.phone).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((contacts.filter(c => c.phone).length / contacts.length) * 100).toFixed(1)}% have phone
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Company Contacts</p>
                <p className="text-2xl font-bold">
                  {contacts.filter(c => c.company).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((contacts.filter(c => c.company).length / contacts.length) * 100).toFixed(1)}% have company
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
