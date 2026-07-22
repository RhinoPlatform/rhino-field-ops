import React, { useState } from 'react';
import { useTruckTelemetry } from '../hooks/useTruckTelemetry';
import { ticketService } from '../services/ticketService';
import { OfflineStorage } from '../services/offlineStorage';
import { ClipboardCheck, Trash2, ShieldAlert, Droplet, AlertTriangle, Send, Clock } from 'lucide-react';

export const RhinoServiceForm = ({ activeAsset, onFormSubmitted, currentTechnician, currentTruckId }) => {
  const [mockServices] = useState([{ id: 'active-job-1', assetId: activeAsset?.id || 'TO-0187', assetType: activeAsset?.type || 'Porta Potty', usageTier: 'Standard', personnelCount: 5, daysSinceLastService: 7, isCompleted: false }]);
  const { services, telemetry, consumablesUsed, toggleServiceStatus } = useTruckTelemetry(mockServices);

  const [po, setPo] = useState('');
  const [rig, setRig] = useState('');
  const [cman, setCman] = useState('');
  const [checklist, setChecklist] = useState({ vacuumWaste: false, washChemical: false, wipeTrash: false, replenish: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChecklistComplete = checklist.vacuumWaste && checklist.washChemical && checklist.wipeTrash && checklist.replenish;

  const handleCheckboxChange = (field) => {
    setChecklist(prev => {
      const updated = { ...prev, [field]: !prev[field] };
      const allChecked = Object.values(updated).every(val => val === true);
      toggleServiceStatus('active-job-1', allChecked);
      return updated;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isChecklistComplete) return;
    setIsSubmitting(true);

    const ticketMetadata = {
      customerId: activeAsset?.customerId || 1,
      leaseWellId: activeAsset?.leaseWellId || 1,
      assetId: 'TO-0187',
      technicianId: currentTechnician?.id || 1,
      truckId: currentTruckId || 1,
      poNumber: po, rigName: rig, companyMan: cman, checklist,
      usageTier: 'Standard', calculatedSubTotal: activeAsset?.rate || 85.00,
      timestamps: { arrival: new Date().toISOString(), finish: new Date().toISOString(), travelDuration: "01:00:00", travelEnd: new Date().toISOString() },
      itemsMatrix: [{ quantity: 1, description: 'Restroom Standard Cleaning', dayRate: activeAsset?.rate || 85.00 }]
    };

    try {
      await ticketService.submitFieldTicket(ticketMetadata, telemetry, consumablesUsed, false);
      alert("Ticket successfully processed and synced to cloud production!");
      if (onFormSubmitted) onFormSubmitted();
    } catch (err) {
      if (err.message === 'NETWORK_DISCONNECTED') {
        const token = localStorage.getItem('rhino_token');
        await OfflineStorage.queueTicket({ ...ticketMetadata, consumablesUsed, tokenContext: token });
        alert("Offline Mode Active: Form serialized and cached safely inside IndexedDB queue.");
        if (onFormSubmitted) onFormSubmitted();
      } else {
        alert(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="text-blue-500 w-6 h-6" />
          <div>
            <h2 className="text-white font-black tracking-tight text-base">DIGITAL SERVICE TICKET ENGINE</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MAPPED TO LEGACY FORM № 001463</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        <form onSubmit={handleFormSubmit} className="md:col-span-7 p-6 flex flex-col gap-5">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">1. Well-Site Field Metadata</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-400">Customer P.O. / AFE</label>
                <input type="text" value={po} onChange={(e) => setPo(e.target.value)} placeholder="AFE-99201" className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-400">Rig Name</label>
                <input type="text" value={rig} onChange={(e) => setRig(e.target.value)} placeholder="Precision Rig #402" className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[11px] font-semibold text-slate-400">Company Man (Supervisor)</label>
                <input type="text" value={cman} onChange={(e) => setCman(e.target.value)} placeholder="John Doe" className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">2. Mandatory Operational Checklist</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
              {['vacuumWaste', 'washChemical', 'wipeTrash', 'replenish'].map(f => (
                <label key={f} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-900/40">
                  <input type="checkbox" checked={checklist[f]} onChange={() => handleCheckboxChange(f)} className="w-4 h-4 rounded text-blue-500 border-slate-700 bg-slate-800 focus:ring-blue-500" />
                  <span className="text-xs font-medium">{f === 'vacuumWaste' ? 'Vacuum and empty restroom septic vault completely' : f === 'washChemical' ? 'Pressure wash, sanitize internal surfaces, & inject chemical' : f === 'wipeTrash' ? 'Deep interior/exterior wipe-down and replace liners' : 'Replenish all missing hygiene consumables'}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={!isChecklistComplete || isSubmitting} className={`w-full font-bold py-3 px-4 rounded-xl shadow-lg text-xs flex items-center justify-center gap-2 mt-2 ${isChecklistComplete ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
            <Send className="w-4 h-4" /> {isSubmitting ? 'Processing Pipeline...' : 'Submit Field Ticket Log'}
          </button>
        </form>
        <div className="md:col-span-5 p-6 bg-slate-900/40 flex flex-col gap-6 text-xs">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">3. Active Truck Tank Metrics</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1"><Droplet className="w-4 h-4 text-cyan-400" /> Clean Water Tank</span>
                <span className="font-mono text-slate-300">{telemetry.currentCleanWater} / 300 GAL</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div className={`h-full ${telemetry.waterAlert === 'LOW_WARNING' ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${(telemetry.currentCleanWater / 300) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1"><Trash2 className="w-4 h-4 text-emerald-400" /> Vacuum Septic Tank</span>
                <span className="font-mono text-slate-300">{telemetry.currentTruckWaste} / 600 GAL</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div className={`h-full ${telemetry.wasteAlert === 'CRITICAL_LOCKOUT' ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'}`} style={{ width: `${(telemetry.currentTruckWaste / 600) * 100}%` }} />
              </div>
              {telemetry.wasteAlert === 'CRITICAL_LOCKOUT' && (
                <div className="p-2 bg-red-950/40 border border-red-800 rounded-lg text-[10px] text-red-400 font-bold flex items-start gap-1"><ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" /><p>CRITICAL LOCKOUT: Capacity exceeded 85%. Route suspended.</p></div>
              )}
            </div>
          </div>
          <div className="space-y-3 border-t border-slate-800 pt-4 flex-1">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">4. Deducted Flight Consumables</h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              {Object.entries(consumablesUsed).map(([k, v]) => (
                <div key={k} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">{k.replace('_', ' ')}</span>
                  <span className="text-white font-black text-sm mt-1">-{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RhinoServiceForm;
