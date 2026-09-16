import React from 'react';
import { Route } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route as RouteIcon, Navigation, Edit, Trash2, Clock, MapPin } from 'lucide-react';

interface RouteCardProps {
  route: Route;
  onEdit: (route: Route) => void;
  onDelete: (route: Route) => void;
}

export function RouteCard({ route, onEdit, onDelete }: RouteCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-4 w-4 text-blue-600 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">{route.name}</h2>
            <p className="text-xs font-medium text-slate-700">{route.description || 'No description provided'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(route)}
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit Route
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(route)}
            title="Delete Route"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-blue-600" />
            Bus Stops ({route.stops?.length || 0}):
          </h3>
        </div>

        {!route.stops || route.stops.length === 0 ? (
          <p className="text-xs italic text-slate-600 font-medium">
            No bus stops added to this route yet. Click Edit Route to add stops.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {route.stops.map((stop, idx) => (
              <div
                key={stop.id || idx}
                className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  {stop.estimatedTime && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="h-3 w-3" />
                      {stop.estimatedTime}
                    </Badge>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 truncate">{stop.name}</h4>

                <div className="flex items-center gap-1 text-[11px] text-slate-700 font-mono font-medium">
                  <MapPin className="h-3 w-3 text-slate-600 shrink-0" />
                  <span className="truncate">
                    {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
