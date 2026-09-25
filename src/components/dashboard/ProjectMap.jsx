import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { formatCurrency, regionName } from "@/lib/portal";

const REGION_PALETTE = [
  "#FCA311", // South East & London
  "#1D1D35", // South West & South Wales
  "#2BB673", // West Midlands & North Wales
  "#3B82F6", // North
  "#A855F7", // East
  "#F43F5E", // Scotland & Northern Ireland
  "#0EA5E9", // Insights & Engagement
];

export function ProjectMap({ projects }) {
  const validProjects = projects.filter((p) => p.latitude && p.longitude);

  const { regionColors, legend } = useMemo(() => {
    const map = {};
    const list = [];
    let idx = 0;
    validProjects.forEach((p) => {
      const region = regionName(p.department_id);
      if (region && region !== p.department_id && !map[region]) {
        map[region] = REGION_PALETTE[idx % REGION_PALETTE.length];
        list.push({ region, color: map[region] });
        idx++;
      }
    });
    return { regionColors: map, legend: list };
  }, [validProjects]);

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
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_3xkp_1_d4c84e7c5c7a1eee6ccca93b"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {validProjects.map((p) => {
          const region = regionName(p.department_id);
          const color = (region && regionColors[region]) || "#94a3b8";
          const live = p.live_project;
          return (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: live ? 0.8 : 0.3,
                weight: live ? 2 : 1.5,
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <p className="font-semibold text-slate-900">{p.name}</p>
                  </div>
                  {p.project_number && <p className="text-xs text-slate-500">{p.project_number}</p>}
                  {region && <p className="mt-0.5 text-xs text-slate-600">{region}</p>}
                  <p className="mt-1 text-xs text-slate-600">{formatCurrency(p.estimated_value)}</p>
                  <p className="text-xs text-slate-500">
                    Status: <span className={live ? "font-medium text-emerald-600" : "text-slate-400"}>
                      {live ? "Live" : "Inactive"}
                    </span>
                  </p>
                  <Link to={`/projects/${p.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                    View project →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[220px] rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
        <p className="mb-1.5 text-[11px] font-semibold text-slate-700">Regions</p>
        <div className="space-y-1">
          {legend.map((item) => (
            <div key={item.region} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px] text-slate-600">{item.region}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-t border-slate-100 pt-1.5">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">Status</p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FCA311]" />
            <span className="text-[10px] text-slate-600">Live (filled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-400 bg-white/30" />
            <span className="text-[10px] text-slate-600">Inactive (hollow)</span>
          </div>
        </div>
      </div>
    </div>
  );
}