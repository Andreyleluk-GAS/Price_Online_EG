import { useState, useRef, useEffect } from 'react';
import { importPrices, importCars, updateSettings, getSettings } from '../../api/client';
import ManualPriceModal from '../ManualPriceModal/ManualPriceModal';
import styles from './AdminPanel.module.css';

export default function AdminPanel({ onSettingsUpdated }) {
  const [priceGasoline92, setPriceGasoline92] = useState('');
  const [priceGasoline95, setPriceGasoline95] = useState('');
  const [pricePropane, setPricePropane] = useState('');
  const [priceMethane, setPriceMethane] = useState('');
  const [priceGibddDocs, setPriceGibddDocs] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [priceFileUpdatedAt, setPriceFileUpdatedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadingCars, setUploadingCars] = useState(false);
  const [uploadCarsResult, setUploadCarsResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverCars, setDragOverCars] = useState(false);
  const [carsLastUpdated, setCarsLastUpdated] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const fileRef = useRef(null);
  const fileCarsRef = useRef(null);

  useEffect(() => {
    async function loadFuelPrices() {
      try {
        const data = await getSettings();
        if (data) {
          setPriceGasoline92(data.price_gasoline_92 ?? '');
          setPriceGasoline95(data.price_gasoline_95 ?? '');
          setPricePropane(data.price_propane ?? '');
          setPriceMethane(data.price_methane ?? '');
          setPriceGibddDocs(data.price_gibdd_docs ?? '');
          setUpdatedAt(data.fuel_prices_updated_at);
          setPriceFileUpdatedAt(data.price_file_updated_at);
        }
      } catch (err) {
        console.error('Failed to load settings in AdminPanel:', err);
      }
    }
    loadFuelPrices();
  }, []);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await importPrices(file);
      setUploadResult({
        success: true,
        message: `Импортировано: ${res.imported || 0} позиций${res.skipped ? ` (пропущено: ${res.skipped})` : ''}`
      });
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setUploadResult({ success: false, message: err.message || 'Ошибка загрузки' });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  async function handleCarsFile(file) {
    if (!file) return;
    setUploadingCars(true);
    setUploadCarsResult(null);
    try {
      const res = await importCars(file);
      setUploadCarsResult({
        success: true,
        message: `Импортировано: ${res.total || 0} авто${res.skipped ? ` (пропущено: ${res.skipped})` : ''}`
      });
      setCarsLastUpdated(new Date().toISOString());
    } catch (err) {
      setUploadCarsResult({ success: false, message: err.message || 'Ошибка загрузки базы авто' });
    } finally {
      setUploadingCars(false);
    }
  }

  function handleCarsDrop(e) {
    e.preventDefault();
    setDragOverCars(false);
    const file = e.dataTransfer.files[0];
    handleCarsFile(file);
  }

  async function handleSavePrices(e) {
    e.preventDefault();
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await updateSettings({
        price_gasoline_92: parseFloat(priceGasoline92),
        price_gasoline_95: parseFloat(priceGasoline95),
        price_propane: parseFloat(pricePropane),
        price_methane: parseFloat(priceMethane),
        price_gibdd_docs: parseFloat(priceGibddDocs),
      });
      setUpdatedAt(res.fuel_prices_updated_at);
      setSaveResult({ success: true, message: 'Цены обновлены' });
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setSaveResult({ success: false, message: err.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Панель администратора</h2>

      {/* File Upload */}
      <div className={styles.block}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 className={styles.blockTitle}>Импорт прайс-листа</h3>
          <div className={styles.headerInfo}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {priceFileUpdatedAt ? `Прайс обновлен: ${new Date(priceFileUpdatedAt).toLocaleString('ru-RU')}` : 'Прайс еще не загружен'}
            </div>
            <button 
              className={`btn-secondary ${styles.desktopOnly}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => setIsManualModalOpen(true)}
            >
              Корректировка цен вручную
            </button>
          </div>
        </div>
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFile(e.target.files[0])}
            className={styles.fileInput}
          />
          <div className={styles.dropContent}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.dropIcon}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className={styles.dropText}>
              {uploading ? 'Загрузка...' : 'Перетащите файл .xlsx или .csv сюда'}
            </p>
            <p className={styles.dropHint}>или нажмите для выбора</p>
          </div>
        </div>
        {uploadResult && (
          <div className={`${styles.resultMsg} ${uploadResult.success ? styles.resultSuccess : styles.resultError}`}>
            {uploadResult.success ? '✓' : '✗'} {uploadResult.message}
          </div>
        )}
      </div>

      {/* Cars Upload */}
      <div className={styles.block}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.blockTitle}>Импорт базы автомобилей (CARLIST)</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {carsLastUpdated ? `База обновлена: ${new Date(carsLastUpdated).toLocaleString('ru-RU')}` : 'База авто еще не загружена'}
          </div>
        </div>
        <div
          className={`${styles.dropZone} ${dragOverCars ? styles.dropZoneActive : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOverCars(true); }}
          onDragLeave={() => setDragOverCars(false)}
          onDrop={handleCarsDrop}
          onClick={() => fileCarsRef.current?.click()}
        >
          <input
            ref={fileCarsRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleCarsFile(e.target.files[0])}
            className={styles.fileInput}
          />
          <div className={styles.dropContent}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.dropIcon}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className={styles.dropText}>
              {uploadingCars ? 'Загрузка...' : 'Перетащите файл базы авто .xlsx сюда'}
            </p>
            <p className={styles.dropHint}>или нажмите для выбора</p>
          </div>
        </div>
        {uploadCarsResult && (
          <div className={`${styles.resultMsg} ${uploadCarsResult.success ? styles.resultSuccess : styles.resultError}`}>
            {uploadCarsResult.success ? '✓' : '✗'} {uploadCarsResult.message}
          </div>
        )}
      </div>

      {/* Fuel Prices */}
      <div className={styles.block}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.blockTitle}>Цены на топливо (₽/л)</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {updatedAt ? `Цены обновлены: ${new Date(updatedAt).toLocaleString('ru-RU')}` : 'Цены еще не заданы'}
          </div>
        </div>
        <form className={styles.priceForm} onSubmit={handleSavePrices}>
          <div className={styles.priceField}>
            <label htmlFor="price-92">Бензин АИ-92</label>
            <input
              type="number"
              id="price-92"
              value={priceGasoline92}
              onChange={(e) => setPriceGasoline92(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <div className={styles.priceField}>
            <label htmlFor="price-95">Бензин АИ-95</label>
            <input
              type="number"
              id="price-95"
              value={priceGasoline95}
              onChange={(e) => setPriceGasoline95(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <div className={styles.priceField}>
            <label htmlFor="price-propane">Пропан</label>
            <input
              type="number"
              id="price-propane"
              value={pricePropane}
              onChange={(e) => setPricePropane(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <div className={styles.priceField}>
            <label htmlFor="price-methane">Метан</label>
            <input
              type="number"
              id="price-methane"
              value={priceMethane}
              onChange={(e) => setPriceMethane(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <div className={styles.priceField}>
            <label htmlFor="price-gibdd">Документы ГИБДД</label>
            <input
              type="number"
              id="price-gibdd"
              value={priceGibddDocs}
              onChange={(e) => setPriceGibddDocs(e.target.value)}
              step="1"
              min="0"
            />
          </div>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить цены'}
          </button>
        </form>
        {saveResult && (
          <div className={`${styles.resultMsg} ${saveResult.success ? styles.resultSuccess : styles.resultError}`}>
            {saveResult.success ? '✓' : '✗'} {saveResult.message}
          </div>
        )}
      </div>

      <ManualPriceModal 
        isOpen={isManualModalOpen} 
        onClose={(saved) => {
          setIsManualModalOpen(false);
          if (saved) {
            setUploadResult({ success: true, message: 'Цены обновлены вручную!' });
            if (onSettingsUpdated) onSettingsUpdated();
          }
        }} 
      />
    </div>
  );
}
