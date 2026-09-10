import { MapPin, Search, Compass, Check } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (value: LocationData) => void;
  label: string;
}

const PRESET_LOCATIONS: LocationData[] = [
  { lat: -6.2088, lng: 106.8456, name: 'HQ Jakarta Pusat (Sudirman)' },
  { lat: -7.2575, lng: 112.7521, name: 'Surabaya Tech Hub (Gubeng)' },
  { lat: -8.4095, lng: 115.1889, name: 'Bali Creative Studio (Canggu)' },
  { lat: 1.3521, lng: 103.8198, name: 'Regional Singapore Hub (Marina Bay)' }
];

export function LocationPicker({ value, onChange, label }: LocationPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Mock Map Container */}
        <div className="relative h-44 bg-slate-100 flex flex-col items-center justify-center overflow-hidden border-b border-slate-100">
          {/* Decorative Map Pattern Grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0f172a_1.5px,transparent_1.5px)] [background-size:16px_16px]"></div>
          
          {/* Mock Roads/Paths */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-full h-1 bg-slate-400 rotate-12"></div>
            <div className="w-full h-1 bg-slate-400 -rotate-45 absolute"></div>
            <div className="w-1 h-full bg-slate-400 left-1/3 absolute"></div>
            <div className="w-1 h-full bg-slate-400 left-2/3 absolute"></div>
            <div className="w-32 h-32 rounded-full border border-slate-400 absolute"></div>
          </div>

          {/* Map Pin Marker */}
          {value ? (
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <MapPin className="w-8 h-8 text-indigo-600 fill-indigo-200" />
              <div className="absolute -bottom-1.5 w-3 h-1 bg-slate-900/30 rounded-full blur-[1px]"></div>
            </div>
          ) : (
            <div className="relative z-10 text-center space-y-1 p-4">
              <Compass className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-slate-500">Belum ada lokasi yang dipilih</p>
            </div>
          )}

          {/* Coordinates overlay badge */}
          {value && (
            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-[10px] font-mono text-white px-2.5 py-1 rounded-md shadow-md">
              LAT: {value.lat.toFixed(4)}, LNG: {value.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Preset Selectors */}
        <div className="p-3 bg-slate-50/50 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Pilih Preset Kantor Cabang</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_LOCATIONS.map((loc) => {
              const isSelected = value?.name === loc.name;
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => onChange(loc)}
                  className={`flex items-center justify-between text-left p-2 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate pr-1">{loc.name.split(' ')[0]} {loc.name.split(' ')[1]}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
