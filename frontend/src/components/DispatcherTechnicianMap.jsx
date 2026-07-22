import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Calendar, User, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const MapRefresher = ({ center }) => {
  const map = useMap();
  if (center) {
    map.flyTo(center, 9);
  }
  return null;
};

const defaultAssetPins = [
  {
    assetId: 'ASSET-101',
    assetType: 'Pump Unit',
    customerName: 'Acme Logistics',
    leaseName: 'Lease 12',
    wellNumber: 'A-7',
    deliveryDate: '2026-07-22',
    cleaningCounter: 3,
    latitude: 31.9686,
    longitude: -102.0779,
    stop_order: 1
  },
  {
    assetId: 'ASSET-102',
    assetType: 'Separator',
    customerName: 'Northwind Energy',
    leaseName: 'Lease 18',
    wellNumber: 'B-12',
    deliveryDate: '2026-07-23',
    cleaningCounter: 1,
    latitude: 31.9,
    longitude: -101.9,
    stop_order: 2
  }
];

export default function DispatcherTechnicianMap({ initialAssetPins = defaultAssetPins }) {
  const [selectedDay, setSelectedDay] = useState('MONDAY ROUTE');
  const [selectedPins, setSelectedPins] = useState([]);
  const [mapCenter] = useState([31.9686, -102.0779]);

  const normalizedPins = useMemo(() => {
    return Array.isArray(initialAssetPins)
      ? initialAssetPins.filter((pin) => pin && Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude) && pin.assetId)
      : [];
  }, [initialAssetPins]);

  const togglePinSelection = (assetId) => {
    setSelectedPins((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
  };

  const handleLaunchNavigation = () => {
    const sortedStops = normalizedPins
      .filter((pin) => selectedPins.includes(pin.assetId))
      .sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

    if (sortedStops.length === 0) {
      window.alert('Highlight at least one pin drop.');
      return;
    }

    const finalStop = sortedStops[sortedStops.length - 1];
    const destinationParam = `${finalStop.latitude},${finalStop.longitude}`;
    const waypointsParam = sortedStops.slice(0, -1).map((stop) => `${stop.latitude},${stop.longitude}`).join('|');
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationParam)}${waypointsParam ? `&waypoints=${encodeURIComponent(waypointsParam)}` : ''}&travelmode=driving`;

    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-[600px] flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-white font-bold tracking-wide text-xs md:text-sm flex items-center gap-1"><MapPin className="text-blue-400 w-4 h-4 animate-pulse" /> RHINO SHARED LOGISTICS CANVAS</h2>
        <div className="flex items-center gap-3">
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs font-semibold">
            {['MONDAY ROUTE', 'TUESDAY ROUTE', 'WEDNESDAY ROUTE', 'THURSDAY ROUTE', 'FRIDAY ROUTE', 'SATURDAY ROUTE', 'SUNDAY ROUTE'].map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
          <button onClick={handleLaunchNavigation} className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow hover:brightness-110"><Navigation className="w-3.5 h-3.5" /> Launch Google Maps ({selectedPins.length})</button>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative z-10">
        <MapContainer center={mapCenter} zoom={9} style={{ width: '100%', height: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapRefresher center={mapCenter} />
          {normalizedPins.map((pin) => {
            const isSelected = selectedPins.includes(pin.assetId);
            return (
              <Marker key={pin.assetId} position={[pin.latitude, pin.longitude]}>
                <Popup>
                  <div className="p-1 min-w-[200px] text-xs font-sans">
                    <div className="flex justify-between border-b pb-1 mb-2 font-bold text-slate-900"><span>{pin.assetId}</span><span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{pin.assetType}</span></div>
                    <div className="space-y-1 text-slate-600">
                      <p><User className="w-3 h-3 inline mr-1 text-slate-400" /> <strong>Customer:</strong> {pin.customerName}</p>
                      <p><MapPin className="w-3 h-3 inline mr-1 text-slate-400" /> <strong>Site:</strong> {pin.leaseName} #{pin.wellNumber}</p>
                      <p><Calendar className="w-3 h-3 inline mr-1 text-slate-400" /> <strong>Delivered:</strong> {pin.deliveryDate}</p>
                      <p><RefreshCw className="w-3 h-3 inline mr-1 text-blue-500" /> <strong>Cleanings:</strong> {pin.cleaningCounter}</p>
                    </div>
                    <button onClick={() => togglePinSelection(pin.assetId)} className={`w-full mt-2 font-bold text-[11px] py-1 rounded border text-center transition-all ${isSelected ? 'bg-amber-500 border-amber-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>{isSelected ? '✓ Added to Queue' : '+ Select for Route'}</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
