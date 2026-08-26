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
  const [isGeneralPriceEnabled, setIsGeneralPriceEnabled] = useState(false);
  const [generalPriceData, setGeneralPriceData] = useState([]);
  const [generalPriceNotes, setGeneralPriceNotes] = useState([]);
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
          setIsGeneralPriceEnabled(data.isGeneralPriceEnabled || false);
          
          if (data.generalPriceNotes && Array.isArray(data.generalPriceNotes)) {
            setGeneralPriceNotes(data.generalPriceNotes);
          } else if (data.generalPriceInfoText) {
            // Backward compatibility for old single text
            setGeneralPriceNotes([{
              id: Date.now().toString(),
              text: data.generalPriceInfoText,
              position: data.generalPriceInfoPosition || 'above',
              isEnabled: true
            }]);
          }
          
          if (data.generalPriceData && data.generalPriceData.length > 0) {
            setGeneralPriceData(data.generalPriceData);
          } else {
            // Default rows from screenshot if empty
            setGeneralPriceData([
              { vehicle_type: '4 цил.', tank_type: 'баллон до 60 л.', composition: 'комплект + баллон + установка', price_kit: 55000, price_install: 34000 },
              { vehicle_type: '6 цил.', tank_type: 'баллон до 60 л.', composition: 'комплект + баллон + установка', price_kit: 100000, price_install: 48000 },
              { vehicle_type: '6 цил.', tank_type: 'баллон 73 л.', composition: 'комплект + баллон + установка', price_kit: 125000, price_install: 48000 },
              { vehicle_type: '6 цил.', tank_type: 'баллон 93 л.', composition: 'комплект + баллон + установка', price_kit: 145000, price_install: 48000 },
              { vehicle_type: '8 цил.', tank_type: 'баллон 73 л.', composition: 'комплект + баллон + установка', price_kit: 130000, price_install: 58000 },
              { vehicle_type: '8 цил.', tank_type: 'баллон 93 л.', composition: 'комплект + баллон + установка', price_kit: 150000, price_install: 58000 }
            ]);
          }
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
        isGeneralPriceEnabled,
        generalPriceData,
        generalPriceNotes
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

      {/* General Price Settings */}
      <div className={styles.block}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 className={styles.blockTitle}>Общий прайс (Без детализации)</h3>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
              <div className={styles.toggleSwitch}>
                <input 
                  type="checkbox" 
                  checked={isGeneralPriceEnabled}
                  onChange={(e) => setIsGeneralPriceEnabled(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </div>
              Включить общий прайс
            </label>
          </div>
        </div>

        {isGeneralPriceEnabled && (
          <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Тип ТС</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Тип Баллон</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Состав</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Ст-ть комплект</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Ст-ть установка</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {generalPriceData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                      <input 
                        type="text" 
                        value={row.vehicle_type} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].vehicle_type = e.target.value;
                          setGeneralPriceData(newData);
                        }}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                      <input 
                        type="text" 
                        value={row.tank_type} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].tank_type = e.target.value;
                          setGeneralPriceData(newData);
                        }}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                      <input 
                        type="text" 
                        value={row.composition} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].composition = e.target.value;
                          setGeneralPriceData(newData);
                        }}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                      <input 
                        type="number" 
                        value={row.price_kit} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].price_kit = Number(e.target.value);
                          setGeneralPriceData(newData);
                        }}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                      <input 
                        type="number" 
                        value={row.price_install} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].price_install = Number(e.target.value);
                          setGeneralPriceData(newData);
                        }}
                        style={{ width: '100%', padding: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => {
                          const newData = generalPriceData.filter((_, i) => i !== idx);
                          setGeneralPriceData(newData);
                        }}
                        style={{ padding: '2px 8px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              onClick={() => {
                setGeneralPriceData([...generalPriceData, { vehicle_type: '', tank_type: '', composition: '', price_kit: 0, price_install: 0 }]);
              }}
              style={{ marginTop: '10px', padding: '6px 12px', cursor: 'pointer' }}
              className="btn-secondary"
            >
              + Добавить строку
            </button>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0 }}>Дополнительная информация (Примечания)</h4>
                <button 
                  onClick={() => {
                    setGeneralPriceNotes([...generalPriceNotes, { id: Date.now().toString(), text: '', position: 'below', isEnabled: true }]);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  + Добавить примечание
                </button>
              </div>

              {generalPriceNotes.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Нет добавленных примечаний.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {generalPriceNotes.map((note, index) => (
                    <div key={note.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                          <div className={styles.toggleSwitch} style={{ transform: 'scale(0.8)', marginRight: '8px' }}>
                            <input 
                              type="checkbox" 
                              checked={note.isEnabled}
                              onChange={(e) => {
                                const newNotes = [...generalPriceNotes];
                                newNotes[index].isEnabled = e.target.checked;
                                setGeneralPriceNotes(newNotes);
                              }}
                            />
                            <span className={styles.toggleSlider}></span>
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{note.isEnabled ? 'Включено' : 'Выключено'}</span>
                        </label>
                        <button 
                          onClick={() => {
                            const newNotes = generalPriceNotes.filter((_, i) => i !== index);
                            setGeneralPriceNotes(newNotes);
                          }}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '1rem', padding: '0 5px' }}
                          title="Удалить примечание"
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#555' }}>Расположение:</label>
                          <select 
                            value={note.position}
                            onChange={(e) => {
                              const newNotes = [...generalPriceNotes];
                              newNotes[index].position = e.target.value;
                              setGeneralPriceNotes(newNotes);
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', fontSize: '0.9rem' }}
                          >
                            <option value="above">Сверху таблицы (как заголовок)</option>
                            <option value="below">Снизу таблицы (как примечание)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#555' }}>Текст примечания:</label>
                          <textarea 
                            value={note.text}
                            onChange={(e) => {
                              const newNotes = [...generalPriceNotes];
                              newNotes[index].text = e.target.value;
                              setGeneralPriceNotes(newNotes);
                            }}
                            placeholder="Введите информацию..."
                            style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <button 
          onClick={handleSavePrices} 
          className={styles.saveBtn} 
          disabled={saving}
          style={{ marginTop: '10px' }}
        >
          {saving ? 'Сохранение...' : 'Сохранить настройки общего прайса'}
        </button>
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
