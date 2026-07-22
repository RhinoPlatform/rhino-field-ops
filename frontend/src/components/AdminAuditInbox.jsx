import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, Clock3 } from 'lucide-react';

export const AdminAuditInbox = () => {
  const auditEntries = [
    { id: 1, title: 'Dispatch Confirmation', status: 'Verified', time: '08:12' },
    { id: 2, title: 'Service Ticket Sync', status: 'Pending Review', time: '09:03' },
    { id: 3, title: 'Asset Reallocation', status: 'Flagged', time: '10:40' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black tracking-tight text-lg">ADMIN AUDIT INBOX</h2>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Operational oversight stream</p>
        </div>
        <div className="rounded-full border border-emerald-700 bg-emerald-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Live review queue
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {auditEntries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center gap-3">
              {entry.status === 'Verified' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : entry.status === 'Flagged' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
              <div>
                <p className="text-sm font-semibold text-white">{entry.title}</p>
                <p className="text-[11px] text-slate-500">{entry.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Clock3 className="w-3.5 h-3.5" />
              {entry.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAuditInbox;
