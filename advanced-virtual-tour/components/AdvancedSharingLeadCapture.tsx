'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Share2, 
  Link, 
  Mail, 
  Download, 
  QrCode, 
  Users, 
  Eye, 
  Globe, 
  Lock, 
  Calendar,
  UserCheck,
  MessageSquare,
  Phone,
  MapPin,
  Building,
  Copy,
  CheckCircle,
  X,
  ExternalLink,
  Zap,
  Target,
  TrendingUp,
  Filter,
  Search,
  FileText,
  BarChart3
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  message?: string;
  source: 'tour_view' | 'contact_form' | 'share_link' | 'qr_code' | 'embed';
  tourId: string;
  tourTitle: string;
  timestamp: Date;
  viewDuration: number;
  pagesViewed: string[];
  interests: string[];
  leadScore: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
}

interface ShareSettings {
  visibility: 'public' | 'private' | 'password' | 'whitelist';
  password?: string;
  allowedEmails?: string[];
  expirationDate?: Date;
  allowDownload: boolean;
  allowFullscreen: boolean;
  showBranding: boolean;
  customMessage?: string;
  trackViews: boolean;
  captureLeads: boolean;
  requireContactInfo: 'none' | 'optional' | 'required';
  leadFormFields: string[];
}

interface SharingAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageViewTime: number;
  completionRate: number;
  sharesByPlatform: Record<string, number>;
  viewsByCountry: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  leadConversionRate: number;
  topReferrers: Array<{ source: string; views: number }>;
}

interface Props {
  tourId: string;
  tourTitle: string;
  tourUrl: string;
  isVisible: boolean;
  onClose: () => void;
  customization?: {
    brandColor: string;
    logo?: string;
    companyName: string;
  };
}

export const AdvancedSharingLeadCapture: React.FC<Props> = ({
  tourId,
  tourTitle,
  tourUrl,
  isVisible,
  onClose,
  customization
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'leads' | 'analytics'>('share');
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    visibility: 'public',
    allowDownload: false,
    allowFullscreen: true,
    showBranding: true,
    trackViews: true,
    captureLeads: true,
    requireContactInfo: 'optional',
    leadFormFields: ['name', 'email', 'company']
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<SharingAnalytics | null>(null);
  const [leadFilter, setLeadFilter] = useState<'all' | 'new' | 'contacted' | 'qualified'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const generateShareUrl = () => {
    const baseUrl = tourUrl;
    const params = new URLSearchParams();
    
    if (shareSettings.visibility === 'password' && shareSettings.password) {
      params.append('pwd', shareSettings.password);
    }
    if (shareSettings.customMessage) {
      params.append('msg', encodeURIComponent(shareSettings.customMessage));
    }
    if (!shareSettings.showBranding) {
      params.append('nobrand', '1');
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  const generateEmbedCode = () => {
    const shareUrl = generateShareUrl();
    return `<iframe 
  src="${shareUrl}&embed=1" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  style="border-radius: 8px;">
</iframe>`;
  };

  const generateQRCode = async (text: string) => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 256;
    canvas.height = 256;

    // Simple QR code simulation (in production, use a proper QR code library)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.fillStyle = '#000000';
    const moduleSize = 8;
    const modules = 32;
    
    // Generate pattern
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    // Add corner markers
    const cornerSize = moduleSize * 7;
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillRect(256 - cornerSize, 0, cornerSize, cornerSize);
    ctx.fillRect(0, 256 - cornerSize, cornerSize, cornerSize);
    
    ctx.fillStyle = '#ffffff';
    const innerSize = moduleSize * 5;
    const offset = moduleSize;
    ctx.fillRect(offset, offset, innerSize, innerSize);
    ctx.fillRect(256 - cornerSize + offset, offset, innerSize, innerSize);
    ctx.fillRect(offset, 256 - cornerSize + offset, innerSize, innerSize);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const shareUrl = generateShareUrl();
    const text = `Check out this virtual tour: ${tourTitle}`;
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, status } : lead
    ));
  };

  const exportLeads = (format: 'csv' | 'json') => {
    const filteredLeads = leads.filter(lead => 
      leadFilter === 'all' || lead.status === leadFilter
    ).filter(lead =>
      searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Message', 'Source', 'Tour', 'Date', 'Status', 'Lead Score'];
      const csvContent = [
        headers.join(','),
        ...filteredLeads.map(lead => [
          `"${lead.name}"`,
          `"${lead.email}"`,
          `"${lead.phone || ''}"`,
          `"${lead.company || ''}"`,
          `"${lead.location || ''}"`,
          `"${lead.message || ''}"`,
          `"${lead.source}"`,
          `"${lead.tourTitle}"`,
          `"${lead.timestamp.toISOString()}"`,
          `"${lead.status}"`,
          lead.leadScore
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${tourTitle.replace(/\s+/g, '-').toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(filteredLeads, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${tourTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (showQR) {
      generateQRCode(generateShareUrl());
    }
  }, [showQR, shareSettings]);

  useEffect(() => {
    // Simulate loading analytics data
    const simulatedAnalytics: SharingAnalytics = {
      totalViews: 1247,
      uniqueViews: 892,
      averageViewTime: 180000, // 3 minutes
      completionRate: 0.68,
      sharesByPlatform: {
        'Direct Link': 450,
        'Email': 320,
        'Social Media': 280,
        'QR Code': 140,
        'Embed': 57
      },
      viewsByCountry: {
        'United States': 520,
        'United Kingdom': 180,
        'Canada': 150,
        'Germany': 120,
        'France': 90,
        'Others': 187
      },
      deviceBreakdown: {
        'Desktop': 0.52,
        'Mobile': 0.35,
        'Tablet': 0.13
      },
      leadConversionRate: 0.08,
      topReferrers: [
        { source: 'company-website.com', views: 280 },
        { source: 'google.com', views: 150 },
        { source: 'linkedin.com', views: 95 },
        { source: 'facebook.com', views: 67 }
      ]
    };
    
    setAnalytics(simulatedAnalytics);

    // Simulate loading leads
    const simulatedLeads: Lead[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        phone: '+1-555-0123',
        company: 'TechCorp Solutions',
        location: 'New York, NY',
        message: 'Interested in scheduling a viewing for our office space.',
        source: 'tour_view',
        tourId,
        tourTitle,
        timestamp: new Date(Date.now() - 3600000),
        viewDuration: 240000,
        pagesViewed: ['lobby', 'office-floor-1', 'conference-room'],
        interests: ['office-space', 'meeting-rooms'],
        leadScore: 85,
        status: 'qualified'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'm.chen@startupxyz.com',
        phone: '+1-555-0456',
        company: 'StartupXYZ',
        location: 'San Francisco, CA',
        source: 'share_link',
        tourId,
        tourTitle,
        timestamp: new Date(Date.now() - 7200000),
        viewDuration: 180000,
        pagesViewed: ['lobby', 'coworking-space'],
        interests: ['coworking', 'flexible-lease'],
        leadScore: 72,
        status: 'new'
      }
    ];
    
    setLeads(simulatedLeads);
  }, [tourId, tourTitle]);

  if (!isVisible) return null;

  const filteredLeads = leads.filter(lead => 
    leadFilter === 'all' || lead.status === leadFilter
  ).filter(lead =>
    searchTerm === '' || 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share & Lead Management</h2>
            <p className="text-gray-600 mt-1">{tourTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
          {[
            { id: 'share', label: 'Share', icon: Share2 },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'leads' && leads.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                  {leads.filter(l => l.status === 'new').length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'share' && (
            <div className="p-6 space-y-6">
              {/* Share Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Sharing Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Visibility
                    </label>
                    <select
                      value={shareSettings.visibility}
                      onChange={(e) => setShareSettings(prev => ({ ...prev, visibility: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">Public - Anyone with link</option>
                      <option value="password">Password Protected</option>
                      <option value="private">Private - Owner only</option>
                      <option value="whitelist">Email Whitelist</option>
                    </select>
                  </div>

                  {shareSettings.visibility === 'password' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={shareSettings.password || ''}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={shareSettings.expirationDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setShareSettings(prev => ({ 
                        ...prev, 
                        expirationDate: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserCheck className="w-4 h-4 inline mr-2" />
                      Contact Info Requirement
                    </label>
                    <select
                      value={shareSettings.requireContactInfo}
                      onChange={(e) => setShareSettings(prev => ({ ...prev, requireContactInfo: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None Required</option>
                      <option value="optional">Optional Lead Form</option>
                      <option value="required">Required Before Viewing</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { key: 'allowDownload', label: 'Allow Download', icon: Download },
                    { key: 'allowFullscreen', label: 'Allow Fullscreen', icon: Eye },
                    { key: 'showBranding', label: 'Show Branding', icon: Building },
                    { key: 'trackViews', label: 'Track Views', icon: TrendingUp },
                    { key: 'captureLeads', label: 'Capture Leads', icon: Target }
                  ].map(option => (
                    <label key={option.key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shareSettings[option.key as keyof ShareSettings] as boolean}
                        onChange={(e) => setShareSettings(prev => ({ 
                          ...prev, 
                          [option.key]: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <option.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Custom Welcome Message
                  </label>
                  <textarea
                    value={shareSettings.customMessage || ''}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, customMessage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add a custom message for visitors..."
                  />
                </div>
              </div>

              {/* Sharing Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Direct Share</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Share URL</label>
                      <button
                        onClick={() => copyToClipboard(generateShareUrl(), 'url')}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        {copied === 'url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied === 'url' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-white p-2 rounded border text-sm break-all">
                      {generateShareUrl()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowQR(true)}
                      className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                    <button
                      onClick={() => setShowEmbedCode(true)}
                      className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Embed
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Social Media</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
                      { name: 'Twitter', color: 'bg-sky-500 hover:bg-sky-600' },
                      { name: 'LinkedIn', color: 'bg-blue-700 hover:bg-blue-800' },
                      { name: 'WhatsApp', color: 'bg-green-600 hover:bg-green-700' },
                      { name: 'Telegram', color: 'bg-blue-500 hover:bg-blue-600' },
                      { name: 'Email', color: 'bg-gray-600 hover:bg-gray-700' }
                    ].map(platform => (
                      <button
                        key={platform.name}
                        onClick={() => shareToSocial(platform.name.toLowerCase())}
                        className={`p-3 text-white rounded-lg transition-colors ${platform.color}`}
                      >
                        {platform.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="p-6 space-y-6">
              {/* Lead Filters */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                  {['all', 'new', 'contacted', 'qualified'].map(status => (
                    <button
                      key={status}
                      onClick={() => setLeadFilter(status as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        leadFilter === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {status} {status !== 'all' && `(${leads.filter(l => l.status === status).length})`}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => exportLeads('csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Leads List */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Engagement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                                <div className="text-sm text-gray-500">{lead.email}</div>
                                {lead.company && (
                                  <div className="text-sm text-gray-500">{lead.company}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                              {lead.source.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{Math.round(lead.viewDuration / 60000)}m {Math.round((lead.viewDuration % 60000) / 1000)}s</div>
                            <div className="text-gray-500">{lead.pagesViewed.length} pages</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{lead.leadScore}</div>
                              <div className={`ml-2 w-16 h-2 rounded-full ${
                                lead.leadScore >= 80 ? 'bg-green-200' :
                                lead.leadScore >= 60 ? 'bg-yellow-200' : 'bg-red-200'
                              }`}>
                                <div 
                                  className={`h-full rounded-full ${
                                    lead.leadScore >= 80 ? 'bg-green-500' :
                                    lead.leadScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${lead.leadScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                              className={`text-sm rounded-full px-3 py-1 border-0 font-medium ${
                                lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                lead.status === 'converted' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                              <option value="lost">Lost</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Details
                            </button>
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Contact
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <Eye className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.uniqueViews.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg. View Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(analytics.averageViewTime / 60000)}m {Math.round((analytics.averageViewTime % 60000) / 1000)}s
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Lead Conversion</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(analytics.leadConversionRate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Shares by Platform</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.sharesByPlatform).map(([platform, count]) => {
                      const percentage = (count / analytics.totalViews) * 100;
                      return (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{platform}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Referrers</h3>
                  <div className="space-y-3">
                    {analytics.topReferrers.map((referrer, index) => (
                      <div key={referrer.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-4">#{index + 1}</span>
                          <span className="text-sm font-medium text-gray-700">{referrer.source}</span>
                        </div>
                        <span className="text-sm text-gray-600">{referrer.views} views</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Views by Country</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.viewsByCountry).map(([country, count]) => {
                      const percentage = (count / analytics.totalViews) * 100;
                      return (
                        <div key={country} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{country}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.deviceBreakdown).map(([device, percentage]) => (
                      <div key={device} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{device}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${percentage * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {(percentage * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">QR Code</h3>
              <button
                onClick={() => setShowQR(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center">
              <canvas
                ref={qrRef}
                className="mx-auto border rounded-lg"
                width={256}
                height={256}
              />
              <p className="text-sm text-gray-600 mt-4">
                Scan this QR code to access the virtual tour
              </p>
              <button
                onClick={() => {
                  const canvas = qrRef.current;
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `${tourTitle}-qr-code.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Embed Code</h3>
              <button
                onClick={() => setShowEmbedCode(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copy this code to embed the tour in your website:
                </label>
                <div className="relative">
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{generateEmbedCode()}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(generateEmbedCode(), 'embed')}
                    className="absolute top-2 right-2 p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                  >
                    {copied === 'embed' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Customization options:</p>
                <ul className="space-y-1">
                  <li>• Adjust width and height attributes as needed</li>
                  <li>• Add custom CSS styling to the iframe container</li>
                  <li>• The embedded tour will respect your sharing settings</li>
                  <li>• Responsive design will adapt to container size</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg font-semibold">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedLead.email}</p>
                </div>
                {selectedLead.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedLead.phone}</p>
                  </div>
                )}
                {selectedLead.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    <p className="text-gray-900">{selectedLead.company}</p>
                  </div>
                )}
                {selectedLead.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{selectedLead.location}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Source</label>
                  <p className="text-gray-900 capitalize">{selectedLead.source.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Visit Date</label>
                  <p className="text-gray-900">{selectedLead.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">View Duration</label>
                  <p className="text-gray-900">
                    {Math.round(selectedLead.viewDuration / 60000)}m {Math.round((selectedLead.viewDuration % 60000) / 1000)}s
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Lead Score</label>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold">{selectedLead.leadScore}</div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full ${
                          selectedLead.leadScore >= 80 ? 'bg-green-500' :
                          selectedLead.leadScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedLead.leadScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Pages Viewed</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLead.pagesViewed.map(page => (
                    <span key={page} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      {page.replace('-', ' ').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Interests</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLead.interests.map(interest => (
                    <span key={interest} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                      {interest.replace('-', ' ').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              {selectedLead.message && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Message</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedLead.message}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <a
                href={`mailto:${selectedLead.email}?subject=Re: Virtual Tour - ${tourTitle}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
              {selectedLead.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};