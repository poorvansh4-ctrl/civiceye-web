"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mapMarkers, hotspots } from '@/data/mock-map';
import type { MapMarker } from '@/data/types';
import { ZoomIn, ZoomOut, AlertTriangle, MapPin } from 'lucide-react';
import Link from 'next/link';

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 80) return <Badge variant="destructive">Critical ({priority})</Badge>;
  if (priority >= 60) return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">High ({priority})</Badge>;
  if (priority >= 40) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium ({priority})</Badge>;
  return <Badge className="bg-green-500 hover:bg-green-600 text-white">Low ({priority})</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'resolved': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
    case 'in progress': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
    case 'under review': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Under Review</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity.toLowerCase()) {
    case 'critical': return <Badge variant="destructive">Critical</Badge>;
    case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
    case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
    default: return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
  }
}

const CATEGORIES = ['All', 'Potholes', 'Garbage', 'Streetlights', 'Water', 'Road Damage', 'Open Drain'];

export default function MapPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const positionedMarkers = mapMarkers.map((marker, index) => {
    const pseudoRandomX = 10 + ((index * 37) % 80);
    const pseudoRandomY = 10 + ((index * 59) % 80);
    return {
      ...marker,
      x: pseudoRandomX,
      y: pseudoRandomY
    };
  });

  const filteredMarkers = activeCategory === 'All' 
    ? positionedMarkers 
    : positionedMarkers.filter(m => m.category === activeCategory);

  const totalMarkers = filteredMarkers.length;
  const criticalCount = filteredMarkers.filter(m => m.severity.toLowerCase() === 'critical').length;

  const getSeverityColor = (severity: string) => {
    switch(severity.toLowerCase()) {
      case 'critical': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
      case 'high': return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
      case 'medium': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]';
      default: return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]';
    }
  };

  const getMarkerSize = (count: number) => {
    if (count > 20) return 'w-8 h-8';
    if (count > 10) return 'w-6 h-6';
    return 'w-4 h-4';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Civic Map</h1>
        <p className="text-secondary mt-1">Geospatial overview of city infrastructure issues</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className={activeCategory === cat ? "bg-accent-blue text-white" : "border-border text-secondary hover:text-foreground"}
            onClick={() => {
              setActiveCategory(cat);
              setSelectedMarker(null);
            }}
            size="sm"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Map & Panel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Container */}
        <div className="lg:col-span-2 relative bg-[#1a1f2e] border border-border rounded-xl min-h-[600px] overflow-hidden map-grid">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <Button variant="outline" size="icon" className="bg-card border-border text-foreground hover:bg-background">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-card border-border text-foreground hover:bg-background">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Markers */}
          {filteredMarkers.map(marker => (
            <div
              key={marker.id}
              className={`absolute rounded-full cursor-pointer transition-transform hover:scale-125 hover:z-20 ${getSeverityColor(marker.severity)} ${getMarkerSize(marker.reports || 1)} ${selectedMarker?.id === marker.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1f2e] z-20 scale-125' : 'opacity-80'}`}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              onClick={() => setSelectedMarker(marker)}
              title={marker.title || marker.category}
            >
              {/* Tooltip on hover is handled natively by title for simplicity, but could be custom */}
            </div>
          ))}

          <div className="absolute bottom-2 right-2 text-xs text-slate-500 bg-card/80 px-2 py-1 rounded backdrop-blur-sm">
            Map powered by Mapbox (connect API key to enable)
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1 h-full">
          <Card className="bg-card border-border h-full">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedMarker ? (
                <div className="space-y-6">
                  <div className="text-center py-6 text-secondary border-2 border-dashed border-border rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a marker on the map to view details</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Summary ({activeCategory})</h3>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-secondary">Visible Markers</span>
                      <span className="font-semibold text-foreground">{totalMarkers}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-secondary">Critical Issues</span>
                      <span className="font-semibold text-red-500">{criticalCount}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedMarker.title || selectedMarker.category}</h2>
                    <p className="text-sm text-secondary mt-1">ID: {selectedMarker.id}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <SeverityBadge severity={selectedMarker.severity} />
                    <PriorityBadge priority={selectedMarker.priority || (selectedMarker.severity === 'Critical' ? 90 : 50)} />
                    <StatusBadge status={selectedMarker.status || 'Under Review'} />
                  </div>
                  
                  <div className="space-y-4 bg-background p-4 rounded-lg border border-border">
                    <div>
                      <p className="text-xs font-medium text-secondary uppercase tracking-wider">Location</p>
                      <p className="text-sm text-foreground mt-1">{selectedMarker.location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-secondary uppercase tracking-wider">Department</p>
                      <p className="text-sm text-foreground mt-1">{selectedMarker.department || 'General Admin'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-secondary uppercase tracking-wider">Reports in this area</p>
                      <p className="text-sm text-foreground mt-1 font-semibold">{selectedMarker.reports || 1}</p>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-accent-blue hover:bg-blue-600 text-white" asChild>
                    <Link href={`/admin/complaints`}>View Related Reports</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hotspots Section */}
      <div className="mt-8 pt-8 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Civic Hotspots</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotspots.map((hotspot, idx) => (
            <Card key={idx} className="bg-card border-border overflow-hidden">
              <div className={`h-1 w-full bg-gradient-to-r from-red-500 to-orange-500 opacity-${Math.min(100, hotspot.issueCount * 2)}`}></div>
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground text-lg truncate" title={hotspot.area}>{hotspot.area}</h3>
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-secondary">Total Issues</p>
                    <p className="text-2xl font-bold text-foreground">{hotspot.issueCount}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">{hotspot.criticalCount} Critical</Badge>
                    <p className="text-xs text-secondary">{hotspot.topCategory}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
