"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  MapPin,
  Navigation,
  Clock,
  ExternalLink,
  ShieldCheck,
  Star,
  CheckCircle2,
  Loader2,
  Store,
} from "lucide-react";

interface PharmacyItem {
  id: string;
  name: string;
  brand: string;
  tag: string;
  badgeColor: string;
  address: string;
  distanceKm: number;
  isOpen24Hours: boolean;
  timing: string;
  slaText: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  googleMapsQuery: string;
}

interface NearbyPharmaciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pincode: string;
  locationName?: string;
}

export function NearbyPharmaciesModal({
  isOpen,
  onClose,
  pincode,
  locationName,
}: NearbyPharmaciesModalProps) {
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyItem | null>(null);
  const [filter, setFilter] = useState<"all" | "janaushadhi" | "247" | "fast">("all");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchNearby() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pharmacies/nearby?pincode=${pincode}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPharmacies(data.pharmacies || []);
            setUserCoords(data.userLocation || null);
            if (data.pharmacies?.length > 0) {
              setSelectedPharmacy(data.pharmacies[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load nearby pharmacies:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchNearby();
    return () => {
      isMounted = false;
    };
  }, [isOpen, pincode]);

  // Leaflet Map initialization
  useEffect(() => {
    if (!isOpen || loading || !mapContainerRef.current || !userCoords) return;

    let map: any = null;

    async function initMap() {
      const coords = userCoords;
      if (!coords || !mapContainerRef.current) return;

      // Dynamic import of Leaflet on client side
      const L = (await import("leaflet")).default;
      // Leaflet CSS inject if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapContainerRef.current) return;

      map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Clean OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // User location pulsing marker
      const userIcon = L.divIcon({
        className: "user-location-pin",
        html: `
          <div style="position: relative; width: 22px; height: 22px;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(13, 148, 136, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background-color: #0d9488; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([coords.lat, coords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<strong>Your Delivery Point</strong><br/>PIN: ${pincode}`);

      // Pharmacy Markers
      pharmacies.forEach((p) => {
        const isJanAushadhi = p.brand === "Jan Aushadhi";
        const pinColor = isJanAushadhi ? "#10b981" : "#0d9488";

        const pharmIcon = L.divIcon({
          className: "pharmacy-pin",
          html: `
            <div style="background-color: ${pinColor}; color: white; border-radius: 12px; padding: 4px 8px; font-weight: bold; font-size: 10px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white; white-space: nowrap;">
              <span>+</span>
              <span>${p.brand}</span>
            </div>
          `,
          iconSize: [80, 24],
          iconAnchor: [40, 24],
        });

        const marker = L.marker([p.lat, p.lng], { icon: pharmIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${p.name}</div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${p.distanceKm} km away • ${p.timing}</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.googleMapsQuery)}" target="_blank" style="display: inline-block; background-color: #0d9488; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 600;">
              Get Directions &rarr;
            </a>
          </div>
        `);

        marker.on("click", () => {
          setSelectedPharmacy(p);
        });
      });
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, loading, userCoords, pharmacies, pincode]);

  if (!isOpen) return null;

  const filteredPharmacies = pharmacies.filter((p) => {
    if (filter === "janaushadhi") return p.brand === "Jan Aushadhi";
    if (filter === "247") return p.isOpen24Hours;
    if (filter === "fast") return p.distanceKm <= 2.0;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/25">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Nearest Verified Pharmacies
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Live Hubs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-teal-600" />
                <span>
                  {locationName ? `${locationName} • ` : ""}Delivery PIN {pincode}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Split View (List + Interactive Map) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Filter Pills + Scrollable Pharmacy List */}
          <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 max-h-[46vh] lg:max-h-none overflow-hidden">
            {/* Filter Pills */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                All Stores ({pharmacies.length})
              </button>
              <button
                onClick={() => setFilter("janaushadhi")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === "janaushadhi"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                }`}
              >
                Jan Aushadhi (Cheapest)
              </button>
              <button
                onClick={() => setFilter("247")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === "247"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100"
                }`}
              >
                24/7 Open
              </button>
              <button
                onClick={() => setFilter("fast")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === "fast"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100"
                }`}
              >
                Within 2 km
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  <span>Locating verified certified pharmacies...</span>
                </div>
              ) : filteredPharmacies.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No pharmacies matched this filter in PIN {pincode}.
                </div>
              ) : (
                filteredPharmacies.map((item) => {
                  const isSelected = selectedPharmacy?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedPharmacy(item);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([item.lat, item.lng], 15, {
                            duration: 0.8,
                          });
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                        isSelected
                          ? "bg-teal-50/70 dark:bg-teal-950/50 border-teal-500 shadow-md shadow-teal-500/10"
                          : "bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {item.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.badgeColor}`}
                            >
                              {item.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {item.address}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-teal-700 dark:text-teal-300">
                            {item.distanceKm} km
                          </span>
                          <span className="block text-[10px] text-slate-400">away</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {item.timing}
                        </span>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            item.googleMapsQuery
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline"
                        >
                          <span>Directions</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Interactive Leaflet Map */}
          <div className="w-full lg:w-1/2 flex flex-col h-[280px] lg:h-auto min-h-[260px] relative bg-slate-100 dark:bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Selected Pharmacy Floating Card on Map bottom */}
            {selectedPharmacy && (
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                    {selectedPharmacy.name}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-1">
                    {selectedPharmacy.slaText} • {selectedPharmacy.distanceKm} km
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    selectedPharmacy.googleMapsQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Navigate</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
