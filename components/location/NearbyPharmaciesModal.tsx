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

      // User location neo-brutalist pulsing marker
      const userIcon = L.divIcon({
        className: "user-location-pin",
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(243, 211, 91, 0.5); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background-color: #f3d35b; border: 3px solid #17140f; box-shadow: 2px 2px 0 #17140f;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([coords.lat, coords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<strong>Your Delivery Point</strong><br/>PIN: ${pincode}`);

      // Pharmacy Markers with Neo-Brutalist badge styling
      pharmacies.forEach((p) => {
        const isJanAushadhi = p.brand === "Jan Aushadhi";
        const pinBg = isJanAushadhi ? "#9bab5a" : "#f3d35b";

        const pharmIcon = L.divIcon({
          className: "pharmacy-pin",
          html: `
            <div style="background-color: ${pinBg}; color: #17140f; border-radius: 12px; padding: 4px 8px; font-weight: 800; font-size: 10px; display: flex; align-items: center; gap: 4px; box-shadow: 2px 2px 0 0 #17140f; border: 2px solid #17140f; white-space: nowrap;">
              <span>+</span>
              <span>${p.brand}</span>
            </div>
          `,
          iconSize: [84, 24],
          iconAnchor: [42, 24],
        });

        const marker = L.marker([p.lat, p.lng], { icon: pharmIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 170px; color: #17140f;">
            <div style="font-weight: 800; color: #17140f; margin-bottom: 2px;">${p.name}</div>
            <div style="color: #555; font-size: 11px; margin-bottom: 6px;">${p.distanceKm} km away • ${p.timing}</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.googleMapsQuery)}" target="_blank" style="display: inline-block; background-color: #17140f; color: #f5f0e1; padding: 4px 10px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 700; border: 1px solid #17140f;">
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#fbf8ef] text-ink rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[8px_8px_0_0_#17140f] border-3 border-ink overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-2 border-ink flex items-center justify-between bg-cream">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sun border-2 border-ink flex items-center justify-center text-ink shadow-brutal-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base sm:text-lg text-ink">
                  Nearest Verified Pharmacies
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sand text-ink border border-ink">
                  Live Hubs
                </span>
              </div>
              <p className="text-xs text-ink/70 font-mono font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-ink" />
                <span>
                  {locationName ? `${locationName} • ` : ""}Delivery PIN {pincode}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-sand hover:bg-sun text-ink border border-ink shadow-xs flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Split View (List + Interactive Map) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#fbf8ef]">
          {/* Left Column: Filter Pills + Scrollable Pharmacy List */}
          <div className="w-full lg:w-1/2 flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-ink max-h-[46vh] lg:max-h-none overflow-hidden">
            {/* Filter Pills */}
            <div className="p-3 border-b-2 border-ink flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 bg-sand/30">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filter === "all"
                    ? "bg-ink text-cream border-ink shadow-brutal-xs"
                    : "bg-cream text-ink border-ink hover:bg-sand"
                }`}
              >
                All Stores ({pharmacies.length})
              </button>
              <button
                onClick={() => setFilter("janaushadhi")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filter === "janaushadhi"
                    ? "bg-olive text-ink border-ink shadow-brutal-xs"
                    : "bg-cream text-ink border-ink hover:bg-olive/20"
                }`}
              >
                Jan Aushadhi (Cheapest)
              </button>
              <button
                onClick={() => setFilter("247")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filter === "247"
                    ? "bg-sky text-ink border-ink shadow-brutal-xs"
                    : "bg-cream text-ink border-ink hover:bg-sky/20"
                }`}
              >
                24/7 Open
              </button>
              <button
                onClick={() => setFilter("fast")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filter === "fast"
                    ? "bg-sun text-ink border-ink shadow-brutal-xs"
                    : "bg-cream text-ink border-ink hover:bg-sun/20"
                }`}
              >
                Within 2 km
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-ink/60 font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-ink" />
                  <span>Locating verified certified pharmacies...</span>
                </div>
              ) : filteredPharmacies.length === 0 ? (
                <div className="py-10 text-center text-xs text-ink/60 font-mono">
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
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer text-left space-y-2 border-2 ${
                        isSelected
                          ? "bg-cream border-ink shadow-brutal-sm"
                          : "bg-white/80 hover:bg-cream border-ink/40 hover:border-ink shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-ink">
                              {item.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sun border border-ink text-ink">
                              {item.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink/70 font-medium mt-0.5 line-clamp-1">
                            {item.address}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-ink font-mono">
                            {item.distanceKm} km
                          </span>
                          <span className="block text-[10px] text-ink/50 font-mono">away</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-ink/20">
                        <span className="flex items-center gap-1 text-ink/80 font-medium">
                          <Clock className="h-3 w-3 text-ink/60" />
                          {item.timing}
                        </span>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            item.googleMapsQuery
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 font-bold text-ink bg-sand hover:bg-sun px-2 py-0.5 rounded-lg border border-ink transition-all text-[11px]"
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
          <div className="w-full lg:w-1/2 flex flex-col h-[280px] lg:h-auto min-h-[260px] relative bg-sand/30">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Selected Pharmacy Floating Card on Map bottom */}
            {selectedPharmacy && (
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-[#fbf8ef] p-3.5 rounded-2xl shadow-brutal-sm border-2 border-ink flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 text-ink">
                <div className="min-w-0">
                  <span className="text-xs font-heading font-black text-ink truncate block">
                    {selectedPharmacy.name}
                  </span>
                  <span className="text-[11px] text-ink/70 font-mono font-medium line-clamp-1">
                    {selectedPharmacy.slaText} • {selectedPharmacy.distanceKm} km
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    selectedPharmacy.googleMapsQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sun hover:bg-sun-deep text-ink font-bold text-xs flex items-center gap-1.5 shrink-0 border-2 border-ink shadow-brutal-xs transition-all"
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
