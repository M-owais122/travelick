'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, Clock, MousePointer, 
  Eye, Target, Globe, Smartphone, Monitor, Headphones,
  Download, Share, Filter, Calendar, MapPin, Zap,
  Activity, ArrowUp, ArrowDown, Play, Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Analytics Types
interface ViewerSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  device: 'desktop' | 'mobile' | 'vr';
  browser: string;
  location?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  userAgent: string;
  referrer?: string;
  panoramasViewed: string[];
  hotspotInteractions: Array<{
    hotspotId: string;
    panoramaId: string;
    timestamp: number;
    type: 'click' | 'hover';
  }>;
  mouseMovements: Array<{
    x: number;
    y: number;
    timestamp: number;
    panoramaId: string;
  }>;
  vrModeUsed: boolean;
  fullscreenUsed: boolean;
  exitPoint?: 'natural' | 'close_button' | 'navigation' | 'error';
}

interface HeatmapPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  intensity: number;
  panoramaId: string;
}

interface TourAnalytics {
  tourId: string;
  totalViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  bounceRate: number; // percentage who viewed only one panorama
  completionRate: number; // percentage who viewed all panoramas
  
  // Time-based metrics
  viewsByDay: Array<{ date: string; views: number; }>;
  viewsByHour: Array<{ hour: number; views: number; }>;
  
  // Device metrics
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    vr: number;
  };
  
  // Geographic data
  geographicData: Array<{
    country: string;
    count: number;
    coordinates: [number, number];
  }>;
  
  // Panorama performance
  panoramaMetrics: Array<{
    panoramaId: string;
    views: number;
    averageViewTime: number;
    exitRate: number;
    heatmapData: HeatmapPoint[];
  }>;
  
  // Hotspot performance
  hotspotMetrics: Array<{
    hotspotId: string;
    panoramaId: string;
    clicks: number;
    hoverTime: number;
    conversionRate: number; // for navigation hotspots
  }>;
  
  // User flow
  userFlow: Array<{
    from: string;
    to: string;
    count: number;
    percentage: number;
  }>;
  
  // Real-time data
  currentActiveUsers: number;
  recentSessions: ViewerSession[];
}

interface TourAnalyticsDashboardProps {
  tourId: string;
  analytics: TourAnalytics;
  onExport?: (format: 'csv' | 'pdf' | 'json') => void;
  onFilterChange?: (filters: any) => void;
  realTimeEnabled?: boolean;
  className?: string;
}

const TourAnalyticsDashboard: React.FC<TourAnalyticsDashboardProps> = ({
  tourId,
  analytics,
  onExport,
  onFilterChange,
  realTimeEnabled = true,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmaps' | 'user-flow' | 'real-time'>('overview');
  const [selectedPanorama, setSelectedPanorama] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapIntensity, setHeatmapIntensity] = useState(0.8);
  
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const flowChartRef = useRef<HTMLDivElement>(null);

  // Real-time data updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      // In a real app, this would fetch from your analytics API
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // Draw heatmap on canvas
  useEffect(() => {
    if (!heatmapCanvasRef.current || !selectedPanorama || !showHeatmap) return;

    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const panoramaData = analytics.panoramaMetrics.find(p => p.panoramaId === selectedPanorama);
    if (!panoramaData?.heatmapData.length) return;

    drawHeatmap(ctx, panoramaData.heatmapData);
  }, [selectedPanorama, showHeatmap, heatmapIntensity, analytics]);

  const drawHeatmap = (ctx: CanvasRenderingContext2D, heatmapData: HeatmapPoint[]) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create gradient for heatmap
    heatmapData.forEach(point => {
      const gradient = ctx.createRadialGradient(
        point.x * canvas.width, point.y * canvas.height, 0,
        point.x * canvas.width, point.y * canvas.height, 30 * heatmapIntensity
      );
      
      const alpha = Math.min(point.intensity * heatmapIntensity, 1);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 0, ${alpha * 0.8})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // Apply blend mode for better visualization
    ctx.globalCompositeOperation = 'multiply';
  };

  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportData = (format: 'csv' | 'pdf' | 'json') => {
    onExport?.(format);
    
    // Generate export based on format
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'json':
        exportToJSON();
        break;
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Views', analytics.totalViews.toString()],
      ['Unique Visitors', analytics.uniqueVisitors.toString()],
      ['Average Session Duration', formatDuration(analytics.averageSessionDuration)],
      ['Bounce Rate', `${analytics.bounceRate.toFixed(1)}%`],
      ['Completion Rate', `${analytics.completionRate.toFixed(1)}%`],
      ...analytics.panoramaMetrics.map(p => [
        `Panorama ${p.panoramaId} Views`, 
        p.views.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour-analytics-${tourId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // PDF export would be implemented with a library like jsPDF
    console.log('Exporting to PDF...');
  };

  const exportToJSON = () => {
    const jsonData = JSON.stringify(analytics, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour-analytics-${tourId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, change, icon, color = 'blue' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-xl shadow-sm border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center text-sm mt-1",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={cn(`text-${color}-600`, "p-3 bg-gray-50 rounded-lg")}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={cn('h-full bg-gray-50', className)}>
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tour Analytics</h1>
            <p className="text-gray-500">Comprehensive insights for Tour #{tourId}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Export Options */}
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              {/* Export dropdown would go here */}
            </div>

            {/* Real-time indicator */}
            {realTimeEnabled && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'heatmaps', label: 'Heatmaps', icon: Target },
              { id: 'user-flow', label: 'User Flow', icon: Activity },
              { id: 'real-time', label: 'Real-time', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Views"
                  value={analytics.totalViews.toLocaleString()}
                  change={15.3}
                  icon={<Eye className="w-5 h-5" />}
                  color="blue"
                />
                
                <MetricCard
                  title="Unique Visitors"
                  value={analytics.uniqueVisitors.toLocaleString()}
                  change={8.7}
                  icon={<Users className="w-5 h-5" />}
                  color="green"
                />
                
                <MetricCard
                  title="Avg. Session Duration"
                  value={formatDuration(analytics.averageSessionDuration)}
                  change={-2.1}
                  icon={<Clock className="w-5 h-5" />}
                  color="orange"
                />
                
                <MetricCard
                  title="Completion Rate"
                  value={`${analytics.completionRate.toFixed(1)}%`}
                  change={12.5}
                  icon={<Target className="w-5 h-5" />}
                  color="purple"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Views Over Time Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="font-semibold mb-4">Views Over Time</h3>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {analytics.viewsByDay.slice(-7).map((day, index) => (
                      <div key={day.date} className="flex flex-col items-center">
                        <div
                          className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                          style={{
                            height: `${(day.views / Math.max(...analytics.viewsByDay.map(d => d.views))) * 200}px`
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="font-semibold mb-4">Device Usage</h3>
                  <div className="space-y-4">
                    {[
                      { device: 'Desktop', count: analytics.deviceBreakdown.desktop, icon: Monitor, color: 'blue' },
                      { device: 'Mobile', count: analytics.deviceBreakdown.mobile, icon: Smartphone, color: 'green' },
                      { device: 'VR', count: analytics.deviceBreakdown.vr, icon: Headphones, color: 'purple' }
                    ].map(item => {
                      const total = analytics.deviceBreakdown.desktop + analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.vr;
                      const percentage = (item.count / total) * 100;
                      
                      return (
                        <div key={item.device} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                            <span className="font-medium">{item.device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 bg-${item.color}-500 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panorama Performance */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold mb-4">Panorama Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Panorama</th>
                        <th className="text-left py-3">Views</th>
                        <th className="text-left py-3">Avg. View Time</th>
                        <th className="text-left py-3">Exit Rate</th>
                        <th className="text-left py-3">Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.panoramaMetrics.map(panorama => (
                        <tr key={panorama.panoramaId} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">Panorama {panorama.panoramaId}</td>
                          <td className="py-3">{panorama.views.toLocaleString()}</td>
                          <td className="py-3">{formatDuration(panorama.averageViewTime)}</td>
                          <td className="py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              panorama.exitRate > 50 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            )}>
                              {panorama.exitRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: `${(panorama.averageViewTime / 60) * 10}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold mb-4">Geographic Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Top Countries</h4>
                    <div className="space-y-2">
                      {analytics.geographicData.slice(0, 5).map(country => (
                        <div key={country.country} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span>{country.country}</span>
                          </div>
                          <span className="font-medium">{country.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    {/* World map visualization would go here */}
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'heatmaps' && (
            <motion.div
              key="heatmaps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Heatmap Controls */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Interaction Heatmaps</h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Intensity:</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={heatmapIntensity}
                        onChange={(e) => setHeatmapIntensity(parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={cn(
                        "px-3 py-1 rounded text-sm",
                        showHeatmap ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      )}
                    >
                      {showHeatmap ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Panorama Selector */}
                <div className="flex flex-wrap gap-2">
                  {analytics.panoramaMetrics.map(panorama => (
                    <button
                      key={panorama.panoramaId}
                      onClick={() => setSelectedPanorama(panorama.panoramaId)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm transition-colors",
                        selectedPanorama === panorama.panoramaId
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      )}
                    >
                      Panorama {panorama.panoramaId}
                      <span className="ml-2 text-xs opacity-75">
                        ({panorama.heatmapData.length} points)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Heatmap Visualization */}
              {selectedPanorama && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h4 className="font-medium mb-4">
                    Heatmap for Panorama {selectedPanorama}
                  </h4>
                  
                  <div className="relative">
                    <canvas
                      ref={heatmapCanvasRef}
                      width={800}
                      height={400}
                      className="w-full border rounded-lg"
                    />
                    
                    {showHeatmap && (
                      <div className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-2 rounded">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded" />
                            High Activity
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded" />
                            Medium Activity
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded" />
                            Low Activity
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'user-flow' && (
            <motion.div
              key="user-flow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* User Flow Visualization */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold mb-4">User Navigation Flow</h3>
                
                <div ref={flowChartRef} className="h-96 border rounded-lg bg-gray-50 flex items-center justify-center">
                  {/* User flow diagram would be implemented here with a library like D3.js or React Flow */}
                  <div className="text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">User Flow Diagram</p>
                    <p className="text-sm">Visual representation of user navigation patterns</p>
                  </div>
                </div>
              </div>

              {/* Flow Statistics */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold mb-4">Navigation Statistics</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">From</th>
                        <th className="text-left py-3">To</th>
                        <th className="text-left py-3">Count</th>
                        <th className="text-left py-3">Percentage</th>
                        <th className="text-left py-3">Drop-off Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.userFlow.map((flow, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3">Panorama {flow.from}</td>
                          <td className="py-3">Panorama {flow.to}</td>
                          <td className="py-3">{flow.count}</td>
                          <td className="py-3">{flow.percentage.toFixed(1)}%</td>
                          <td className="py-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-orange-500 rounded-full"
                                style={{ width: `${(100 - flow.percentage)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'real-time' && (
            <motion.div
              key="real-time"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Active Users"
                  value={analytics.currentActiveUsers}
                  icon={<Users className="w-5 h-5" />}
                  color="green"
                />
                
                <MetricCard
                  title="Views Today"
                  value={analytics.viewsByDay[analytics.viewsByDay.length - 1]?.views || 0}
                  icon={<Eye className="w-5 h-5" />}
                  color="blue"
                />
                
                <MetricCard
                  title="Recent Sessions"
                  value={analytics.recentSessions.length}
                  icon={<Activity className="w-5 h-5" />}
                  color="purple"
                />
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.recentSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <p className="text-sm font-medium">
                            User from {session.location?.country || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.device} • {session.panoramasViewed.length} panoramas viewed
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TourAnalyticsDashboard;