import { useState, useMemo, useEffect } from 'react';

export function useCalculator(settings, priceItems) {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [selectedTank, setSelectedTank] = useState(null);
  const [cylinders, setCylinders] = useState(null);
  const [discountMontage, setDiscountMontage] = useState(false);
  const [gibddDocs, setGibddDocs] = useState(false);
  const [gboFuelType, setGboFuelType] = useState('PROPAN');
  const [fuelType, setFuelType] = useState('92');
  const [consumption, setConsumption] = useState(10);
  const [mileage, setMileage] = useState(2000);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState({}); // { [id]: item }

  const targetOptionIds = useMemo(() => {
    if (!selectedCar?.targetOptions) return [];
    return selectedCar.targetOptions.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  }, [selectedCar]);

  useEffect(() => {
    if (selectedCar) {
      if (selectedCar.cylinders) {
        setCylinders(selectedCar.cylinders);
      }
      
      if (priceItems?.extraOptions) {
        const targetExtras = priceItems.extraOptions.filter(e => targetOptionIds.includes(e.id));
        if (targetExtras.length > 0) {
          setSelectedExtras((prev) => {
            const next = { ...prev };
            targetExtras.forEach(e => {
              next[e.id] = e;
            });
            return next;
          });
        }
      }
    }
  }, [selectedCar, targetOptionIds, priceItems]);

  useEffect(() => {
    let nextSystem = null;
    let nextTank = null;

    if (priceItems) {
      if (cylinders) {
        const fuelPrefix = gboFuelType === 'METAN' ? 'systemsMetan' : 'systemsPropan';
        const sysCategory = `${fuelPrefix}${cylinders}`;
        const fallbackSys = gboFuelType === 'METAN' && cylinders === 4 ? priceItems.systemsMetan : null;
        const validSystems = priceItems[sysCategory] || fallbackSys || [];
        
        nextSystem = validSystems.find(s => targetOptionIds.includes(s.id)) || null;
      }

      const tanksPool = gboFuelType === 'METAN' 
        ? (priceItems.optionsMetanTanks || [])
        : (priceItems.optionsPropanTanks || []);

      nextTank = tanksPool.find(t => targetOptionIds.includes(t.id)) || null;

      if (!nextTank) {
        const defaultTanks = tanksPool.filter(t => t.name && t.name.includes('[Y]'));
        if (defaultTanks.length > 0) {
          defaultTanks.sort((a, b) => a.id.localeCompare(b.id));
          nextTank = defaultTanks[0];
        }
      }
    }

    setSelectedSystem(nextSystem);
    setSelectedTank(nextTank);

  }, [gboFuelType, cylinders, priceItems, targetOptionIds]);

  useEffect(() => {
    setSelectedExtras((prevExtras) => {
      const nextExtras = {};
      Object.entries(prevExtras).forEach(([id, item]) => {
        if (!item || !item.fuelScope) {
          nextExtras[id] = item;
          return;
        }

        if (item.fuelScope !== 'BOTH' && item.fuelScope !== gboFuelType) {
          return;
        }

        const tags = item.name ? (item.name.match(/\[(.*?)\]/g) || []) : [];
        if (tags.length > 0) {
          const systemCodePrefix = selectedSystem?.id?.substring(0, 3);
          if (!systemCodePrefix) return;
          if (!tags.some(tag => tag.includes(systemCodePrefix))) return;
        }

        if (item.optionCategory === 'Y') {
          return;
        }

        nextExtras[id] = item;
      });
      return nextExtras;
    });
  }, [gboFuelType, selectedSystem]);

  // The effect for 'cylinders' was merged with 'gboFuelType' above to preserve the default tank logic.

  const petrolPrice92 = settings?.price_gasoline_92 || 0;
  const petrolPrice95 = settings?.price_gasoline_95 || 0;
  const gasPrice = gboFuelType === 'METAN' ? (settings?.price_methane || 0) : (settings?.price_propane || 0);
  const gibddPrice = Number(settings?.price_gibdd_docs) || 0;

  // Toggle an extra option on/off
  function toggleExtra(item) {
    setSelectedExtras((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  }

  const calculations = useMemo(() => {
    const systemPrice = selectedSystem?.price;
    const tankSurcharge = selectedTank?.price;
    const systemPriceValue = systemPrice === 'по запросу' ? 0 : (systemPrice || 0);
    const tankSurchargeValue = tankSurcharge === 'по запросу' ? 0 : (tankSurcharge || 0);
    const gibddTotal = gibddDocs ? gibddPrice : 0;
    const discount = discountMontage ? (cylinders === 4 ? 1000 : 2000) : 0;

    // Sum of selected extra options (treat 'по запросу' as 0)
    const extrasTotal = Object.values(selectedExtras).reduce((sum, item) => {
      if (item.price === 'по запросу') return sum; 
      return sum + (item.price || 0);
    }, 0);

    const hasUnknownPrice =
      (selectedSystem && selectedSystem.price === 'по запросу') ||
      (selectedTank && selectedTank.price === 'по запросу') ||
      Object.values(selectedExtras).some((item) => item.price === 'по запросу');

    // totalPrice is now always a number, preventing NaN
    const totalPrice = systemPriceValue + tankSurchargeValue + gibddTotal - discount + extrasTotal;

    const petrolPrice = fuelType === '92' ? petrolPrice92 : petrolPrice95;
    const petrolCost = (mileage / 100) * consumption * petrolPrice;
    const gasCost = (mileage / 100) * (consumption * 1.15) * gasPrice;
    const monthlySavings = petrolCost - gasCost;
    const paybackMonths =
      monthlySavings > 0 && totalPrice > 0 ? totalPrice / monthlySavings : Infinity;

    return {
      systemPrice,
      tankSurcharge,
      discount,
      totalPrice,
      extrasTotal,
      hasUnknownPrice,
      petrolPrice,
      petrolCost,
      gasCost,
      monthlySavings,
      paybackMonths,
    };
  }, [
    selectedSystem, selectedTank, cylinders, discountMontage,
    gibddDocs, fuelType, consumption, mileage,
    gboFuelType, selectedExtras, settings,
    petrolPrice92, petrolPrice95, gasPrice, gibddPrice, targetOptionIds
  ]);

  const isSelectedExtra = (item) => !!selectedExtras[item.id];

  return {
    selectedSystem, setSelectedSystem,
    selectedTank, setSelectedTank,
    cylinders, setCylinders,
    discountMontage, setDiscountMontage,
    gibddDocs, setGibddDocs,
    gboFuelType, setGboFuelType,
    fuelType, setFuelType,
    consumption, setConsumption,
    mileage, setMileage,
    selectedCar, setSelectedCar,
    targetOptionIds,
    selectedExtras, setSelectedExtras,
    ...calculations,
    toggleExtra,
    isSelectedExtra,
  };
}
