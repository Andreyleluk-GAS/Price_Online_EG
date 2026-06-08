import { useState, useEffect, useCallback } from 'react';
import { getSettings, getPriceItems } from './api/client';
import { useCalculator } from './hooks/useCalculator';
import Header from './components/Header/Header';
import CarSelect from './components/CarSelect/CarSelect';
import SystemSelect from './components/SystemSelect/SystemSelect';
import TankSelect from './components/TankSelect/TankSelect';
import Options from './components/Options/Options';
import SavingsCalc from './components/SavingsCalc/SavingsCalc';
import StickyFooter from './components/StickyFooter/StickyFooter';
import ProposalModal from './components/ProposalModal/ProposalModal';
import AdminPanel from './components/AdminPanel/AdminPanel';
import './App.css';

export default function App() {
  const [settings, setSettings] = useState(null);
  const [priceItems, setPriceItems] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const calc = useCalculator(settings, priceItems);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const loadPriceItems = useCallback(async () => {
    try {
      const data = await getPriceItems();
      setPriceItems(data);
    } catch (err) {
      console.error('Failed to load price items:', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadPriceItems();
  }, [loadSettings, loadPriceItems]);

  // Called when admin updates data (import or settings change)
  function handleDataUpdated() {
    loadSettings();
    loadPriceItems();
  }

  return (
    <div className={`app ${calc.gboFuelType === 'METAN' ? 'theme-metan' : ''}`}>
      <Header
        settings={settings}
        showAdmin={showAdmin}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
      />

      <main className="main">
        <div className="container">
          {showAdmin ? (
            <AdminPanel
              settings={settings}
              onSettingsUpdated={handleDataUpdated}
            />
          ) : (
            <div className="calculator">
              <CarSelect
                cylinders={calc.cylinders}
                onCylindersChange={calc.setCylinders}
                onCarSelect={calc.setSelectedCar}
                gboFuelType={calc.gboFuelType}
                onFuelTypeChange={calc.setGboFuelType}
                priceItems={priceItems}
              />

              <SystemSelect
                gboFuelType={calc.gboFuelType}
                isMetan={calc.gboFuelType === 'METAN'}
                cylinders={calc.cylinders}
                selectedCar={calc.selectedCar}
                selectedSystem={calc.selectedSystem}
                onSelect={calc.setSelectedSystem}
                priceItems={priceItems}
              />

              <TankSelect
                gboFuelType={calc.gboFuelType}
                isMetan={calc.gboFuelType === 'METAN'}
                selectedTank={calc.selectedTank}
                onSelect={calc.setSelectedTank}
                priceItems={priceItems}
                targetBalloonsIds={calc.targetBalloonsIds}
              />

              <Options
                selectedSystem={calc.selectedSystem}
                cylinders={calc.cylinders}
                gboFuelType={calc.gboFuelType}
                isMetan={calc.gboFuelType === 'METAN'}
                discountMontage={calc.discountMontage}
                onDiscountChange={calc.setDiscountMontage}
                gibddDocs={calc.gibddDocs}
                onGibddDocsChange={calc.setGibddDocs}
                gibddPrice={calc.gibddPrice}
                priceItems={priceItems}
                selectedExtras={calc.selectedExtras}
                onSaveExtras={(extrasArray) => {
                  const newExtrasObj = {};
                  extrasArray.forEach(item => { newExtrasObj[item.id] = item; });
                  calc.setSelectedExtras(newExtrasObj);
                }}
                settings={settings}
              />

              <SavingsCalc
                isMetan={calc.gboFuelType === 'METAN'}
                fuelType={calc.fuelType}
                onFuelTypeChange={calc.setFuelType}
                consumption={calc.consumption}
                onConsumptionChange={calc.setConsumption}
                mileage={calc.mileage}
                onMileageChange={calc.setMileage}
                petrolCost={calc.petrolCost}
                gasCost={calc.gasCost}
                monthlySavings={calc.monthlySavings}
                paybackMonths={calc.paybackMonths}
              />
            </div>
          )}
        </div>
      </main>

      <StickyFooter
        gboFuelType={calc.gboFuelType}
        totalPrice={calc.totalPrice}
        onGenerateProposal={() => setShowProposal(true)}
        visible={!showAdmin && !!calc.selectedSystem}
      />

      <ProposalModal
        show={showProposal}
        onClose={() => setShowProposal(false)}
        selectedCar={calc.selectedCar}
        cylinders={calc.cylinders}
        gboFuelType={calc.gboFuelType}
        selectedSystem={calc.selectedSystem}
        selectedTank={calc.selectedTank}
        discountMontage={calc.discountMontage}
        discount={calc.discount}
        gibddDocs={calc.gibddDocs}
        gibddPrice={calc.gibddPrice}
        settings={settings}
        totalPrice={calc.totalPrice}
        petrolCost={calc.petrolCost}
        gasCost={calc.gasCost}
        monthlySavings={calc.monthlySavings}
        paybackMonths={calc.paybackMonths}
        fuelType={calc.fuelType}
        selectedExtras={calc.selectedExtras}
        consumption={calc.consumption}
        mileage={calc.mileage}
      />
    </div>
  );
}
