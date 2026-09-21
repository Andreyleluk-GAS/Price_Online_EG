import { useState, useEffect, useCallback } from 'react';
import { getSettings, getPriceItems, getPpData } from './api/client';
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
import GeneralPriceView from './components/GeneralPriceView/GeneralPriceView';
import PpPriceView from './components/PpPriceView/PpPriceView';
import './App.css';

export default function App() {
  const [settings, setSettings] = useState(null);
  const [priceItems, setPriceItems] = useState(null);
  const [activeTab, setActiveTab] = useState('gbo');
  const [ppData, setPpData] = useState(null);
  const [loadingPp, setLoadingPp] = useState(true);
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
      const filteredData = {};
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          filteredData[key] = data[key].filter(item => item.price !== '!');
        } else {
          filteredData[key] = data[key];
        }
      });
      setPriceItems(filteredData);
    } catch (err) {
      console.error('Failed to load price items:', err);
    }
  }, []);

  const loadPpData = useCallback(async () => {
    try {
      const data = await getPpData();
      setPpData(data);
    } catch (err) {
      console.error('Failed to load PP data:', err);
    } finally {
      setLoadingPp(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadPriceItems();
    loadPpData();
  }, [loadSettings, loadPriceItems, loadPpData]);

  // Called when admin updates data (import or settings change)
  function handleDataUpdated() {
    loadSettings();
    loadPriceItems();
    loadPpData();
  }

  return (
    <div className={`app ${calc.gboFuelType === 'METAN' ? 'theme-metan' : ''}`}>
      <Header
        settings={settings}
        showAdmin={showAdmin}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      <main className="main">
        <div className="container">
          {showAdmin ? (
            <AdminPanel
              settings={settings}
              onSettingsUpdated={handleDataUpdated}
              initialTab={activeTab}
            />
          ) : activeTab === 'pp' ? (
            <PpPriceView 
              data={ppData} 
              loading={loadingPp}
            />
          ) : settings?.isGeneralPriceEnabled ? (
            <GeneralPriceView 
              data={settings.generalPriceData} 
              settings={settings}
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
                cylinders={calc.cylinders}
                selectedCar={calc.selectedCar}
                isMetan={calc.gboFuelType === 'METAN'}
                selectedSystem={calc.selectedSystem}
                onSelect={(sys) => {
                  calc.setSelectedSystem(sys);
                  if (sys && sys.cylinders) {
                    calc.setCylinders(Number(sys.cylinders));
                  }
                }}
                priceItems={priceItems}
              />

              <TankSelect
                gboFuelType={calc.gboFuelType}
                isMetan={calc.gboFuelType === 'METAN'}
                selectedTank={calc.selectedTank}
                onSelect={calc.setSelectedTank}
                priceItems={priceItems}
                targetOptionIds={calc.targetOptionIds}
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
        visible={!showAdmin && activeTab === 'gbo' && !settings?.isGeneralPriceEnabled && !!calc.selectedSystem}
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
        priceItems={priceItems}
      />
    </div>
  );
}
