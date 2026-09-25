import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/portal";

export function ProjectMap({ projects }) {
  const validProjects = projects.filter((p) => p.latitude && p.longitude);

  if (validProjects.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        No project locations available
      </div>
    );
  }

  return (
    <div className="relative z-0">
      <MapContainer
        center={[54.5, -2]}
        zoom={6}
        style={{ height: "400px", width: "100%" }}
        className="rounded-xl overflow-hidden"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {validProjects.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={8}
            pathOptions={{
              color: p.live_project ? "#FCA311" : "#94a3b8",
              fillColor: p.live_project ? "#FCA311" : "#94a3b8",
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-slate-900">{p.name}</p>
                {p.project_number && <p className="text-xs text-slate-500">{p.project_number}</p>}
                <p className="mt-1 text-xs text-slate-600">{formatCurrency(p.estimated_value)}</p>
                <Link to={`/projects/${p.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                  View project →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}