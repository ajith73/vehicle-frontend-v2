import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export const REQUEST_RADIUS_DEFAULT = 10;

export const REQUEST_FLOW_PROGRESS_ITEMS = [
  { id: 1 as const, label: "What's the problem?" },
  { id: 2 as const, label: 'Select Vehicle' },
  { id: 3 as const, label: 'Choose Location' },
  { id: 4 as const, label: 'Additional Details' },
  { id: 5 as const, label: 'Confirm Request' }
];

export const customerPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:18px;height:18px;border-radius:999px;background:#f97316;border:3px solid white;box-shadow:0 8px 20px rgba(15,23,42,0.28);"></div>
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid #f97316;margin-top:-1px;"></div>
  </div>`,
  iconSize: [18, 30],
  iconAnchor: [9, 30]
});

export const mechanicPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="padding:5px 10px;border-radius:999px;background:#0f766e;color:white;font-size:10px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,0.24);">Partner</div>
    <div style="width:12px;height:12px;background:#0f766e;transform:rotate(45deg);margin-top:-6px;border-radius:3px;"></div>
  </div>`,
  iconSize: [74, 32],
  iconAnchor: [37, 32]
});

export const getDistanceKm = (startLat: number, startLng: number, endLat: number, endLng: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) * Math.cos(toRadians(endLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export function MapCenterer({ coords }: { coords: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(coords, map.getZoom(), { animate: true });
  }, [coords, map]);

  return null;
}

export function MapClickHandler({ onSelect }: { onSelect: (coords: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

export const getRequestFlowTileUrl = (theme: 'light' | 'dark') =>
  theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const getRequestFlowTileAttribution = (theme: 'light' | 'dark') =>
  theme === 'dark'
    ? '&copy; OpenStreetMap contributors &copy; CARTO'
    : '&copy; OpenStreetMap contributors';
