'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

export default function MapPicker({
  onLocationSelect,
  initialLat,
  initialLng,
}: {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}) {
  const [position, setPosition] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : [22.3072, 73.1812],
  );
  const [address, setAddress] = useState('');

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(addr);
      onLocationSelect(lat, lng, addr);
    } catch {
      const addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(addr);
      onLocationSelect(lat, lng, addr);
    }
  };

  return (
    <div className="space-y-3">
      <div className="h-64 rounded-xl overflow-hidden border border-gray-200 relative">
        <LeafletMap
          position={position}
          onPositionChange={(lat, lng) => {
            setPosition([lat, lng]);
            reverseGeocode(lat, lng);
          }}
        />
        <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg px-3 py-1.5 shadow text-xs text-gray-500">
          Click map to pin location
        </div>
      </div>
      {address && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
          <MapPin size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">{address}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Latitude</label>
          <input
            value={position[0].toFixed(6)}
            readOnly
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Longitude</label>
          <input
            value={position[1].toFixed(6)}
            readOnly
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
          />
        </div>
      </div>
    </div>
  );
}
