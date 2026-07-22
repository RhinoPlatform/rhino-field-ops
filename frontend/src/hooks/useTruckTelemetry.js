import { useState, useEffect } from 'react';

export const useTruckTelemetry = (initialServicesList = []) => {
  const MAX_CLEAN_WATER = 300;
  const MAX_TRUCK_WASTE = 600;

  const [services, setServices] = useState(initialServicesList);
  const [dischargeLog, setDischargeLog] = useState([]);
  const [telemetry, setTelemetry] = useState({
    currentCleanWater: MAX_CLEAN_WATER,
    currentTruckWaste: 0,
    waterAlert: 'OK',
    wasteAlert: 'OK'
  });
  const [consumablesUsed, setConsumablesUsed] = useState({
    toilet_paper: 0, blue_chemical: 0, deodorizer_pills: 0, hand_soap: 0, paper_towels: 0, trash_bags: 0
  });

  useEffect(() => {
    const totals = services.reduce((acc, s) => {
      if (!s.isCompleted) return acc;
      const mult = s.assetType === 'Combo Trailer' ? 2 : 1;

      acc.water += 10 * mult;

      let vault = 10;
      if (s.usageTier === 'Light') vault += 17.5;
      else if (s.usageTier === 'Standard') vault += 25.0;
      else if (s.usageTier === 'Dynamic' && s.personnelCount && s.daysSinceLastService) {
        vault += (s.personnelCount * 0.15 * s.daysSinceLastService);
      } else {
        vault += 25.0;
      }
      acc.waste += vault * mult;

      acc.items.toilet_paper += 1 * mult;
      acc.items.blue_chemical += 0.5 * mult;
      acc.items.deodorizer_pills += 2 * mult;
      acc.items.hand_soap += 0.25 * mult;
      acc.items.paper_towels += 1 * mult;
      acc.items.trash_bags += 3 * mult;

      return acc;
    }, { water: 0, waste: 0, items: { toilet_paper: 0, blue_chemical: 0, deodorizer_pills: 0, hand_soap: 0, paper_towels: 0, trash_bags: 0 } });

    const finalWater = Math.max(0, MAX_CLEAN_WATER - totals.water);
    const finalWaste = Math.min(MAX_TRUCK_WASTE, totals.waste);

    setTelemetry({
      currentCleanWater: Number(finalWater.toFixed(2)),
      currentTruckWaste: Number(finalWaste.toFixed(2)),
      waterAlert: finalWater <= 30 ? 'LOW_WARNING' : 'OK',
      wasteAlert: finalWaste >= 510 ? 'CRITICAL_LOCKOUT' : 'OK'
    });
    setConsumablesUsed(totals.items);
  }, [services]);

  const toggleServiceStatus = (id, isChecked) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isCompleted: isChecked, calculatedAt: new Date().toISOString() } : s));
  };

  const recordDischarge = (facility = 'WASTE_FACILITY') => {
    setDischargeLog(prev => [...prev, { timestamp: new Date().toISOString(), wasteBeforeDump: telemetry.currentTruckWaste, dumpedAt: facility }]);
    setServices(prev => prev.map(s => ({ ...s, isCompleted: false, calculatedAt: null })));
  };

  return { services, telemetry, consumablesUsed, dischargeLog, toggleServiceStatus, recordDischarge, caps: { MAX_CLEAN_WATER, MAX_TRUCK_WASTE } };
};
