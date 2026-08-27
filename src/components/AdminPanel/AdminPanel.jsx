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
  const [savedIsGeneralPriceEnabled, setSavedIsGeneralPriceEnabled] = useState(false);
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
  
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      let _generalPriceData = [...generalPriceData];
      const draggedItemContent = _generalPriceData.splice(dragItem.current, 1)[0];
      _generalPriceData.splice(dragOverItem.current, 0, draggedItemContent);
      setGeneralPriceData(_generalPriceData);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

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
          setSavedIsGeneralPriceEnabled(data.isGeneralPriceEnabled || false);
          
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
      setSavedIsGeneralPriceEnabled(isGeneralPriceEnabled);
      setSaveResult({ success: true, message: 'Цены обновлены' });
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setSaveResult({ success: false, message: err.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  }

  const sortedGeneralPriceNotes = [...generalPriceNotes].sort((a, b) => {
    if (a.position === b.position) return 0;
    return a.position === 'above' ? -1 : 1;
  });

  const updateNote = (id, field, value) => {
    setGeneralPriceNotes(generalPriceNotes.map(note => 
      note.id === id ? { ...note, [field]: value } : note
    ));
  };

  return (
    <div className={styles.adminPanel}>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
            {isGeneralPriceEnabled !== savedIsGeneralPriceEnabled && (
              <button 
                onClick={handleSavePrices} 
                className={styles.publishBtn}
                disabled={saving}
              >
                {saving ? '...' : (isGeneralPriceEnabled ? 'Подтвердить включение' : 'Подтвердить отключение')}
              </button>
            )}
          </div>
        </div>

        {savedIsGeneralPriceEnabled && (
          <div className={styles.activePriceBanner}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            В данный момент на сайте опубликован Общий прайс (калькулятор цен скрыт)
          </div>
        )}

        <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
          <table className={styles.priceTable}>
              <thead>
                <tr>
                  <th className={styles.colDrag}></th>
                  <th className={styles.colType}>Тип ТС</th>
                  <th className={styles.colTank}>Тип Баллона</th>
                  <th className={styles.colComposition}>Состав</th>
                  <th className={styles.priceCol}>Стоимость комплект</th>
                  <th className={styles.priceCol}>Стоимость установка</th>
                  <th className={styles.colAction} title="Действия">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}>
                      <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {generalPriceData.map((row, idx) => (
                  <tr 
                    key={idx}
                    draggable
                    onDragStart={(e) => dragItem.current = idx}
                    onDragEnter={(e) => dragOverItem.current = idx}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <td className={styles.colDrag}>
                      <div title="Потяните для сортировки">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </div>
                    </td>
                    <td className={styles.colType}>
                      <input 
                        type="text" 
                        value={row.vehicle_type} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].vehicle_type = e.target.value;
                          setGeneralPriceData(newData);
                        }}
                        className={styles.priceInput}
                      />
                    </td>
                    <td className={styles.colTank}>
                      <input 
                        type="text" 
                        value={row.tank_type} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].tank_type = e.target.value;
                          setGeneralPriceData(newData);
                        }}
                        className={styles.priceInput}
                      />
                    </td>
                    <td className={styles.colComposition}>
                      <input 
                        type="text" 
                        value={row.composition} 
                        onChange={(e) => {
                          const newData = [...generalPriceData];
                          newData[idx].composition = e.target.value;
                          setGeneralPriceData(newData);
                        }}
                        className={styles.priceInput}
                      />
                    </td>
                    <td className={styles.priceCol}>
                      <input 
                        type="text" 
                        value={row.price_kit === 0 ? '0' : (row.price_kit ? row.price_kit.toLocaleString('ru-RU') : '')} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                          const newData = [...generalPriceData];
                          newData[idx].price_kit = isNaN(val) ? 0 : val;
                          setGeneralPriceData(newData);
                        }}
                        className={styles.priceInput}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className={styles.priceCol}>
                      <input 
                        type="text" 
                        value={row.price_install === 0 ? '0' : (row.price_install ? row.price_install.toLocaleString('ru-RU') : '')} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                          const newData = [...generalPriceData];
                          newData[idx].price_install = isNaN(val) ? 0 : val;
                          setGeneralPriceData(newData);
                        }}
                        className={styles.priceInput}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className={styles.colAction}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button 
                          className={styles.iconBtn}
                          onClick={() => {
                            const newData = [...generalPriceData];
                            newData.splice(idx + 1, 0, { ...row });
                            setGeneralPriceData(newData);
                          }}
                          title="Копировать строку"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                        <button 
                          className={styles.deleteRowBtn}
                          onClick={() => {
                            const newData = generalPriceData.filter((_, i) => i !== idx);
                            setGeneralPriceData(newData);
                          }}
                          title="Удалить строку"
                        >
                          ✕
                        </button>
                      </div>
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
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Нет примечаний
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {sortedGeneralPriceNotes.map((note) => (
                    <div key={note.id} className={`${styles.noteCard} ${note.position === 'above' ? styles.noteCardAbove : styles.noteCardBelow}`}>
                      <div className={styles.noteHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                            <div className={styles.toggleSwitch} style={{ transform: 'scale(0.8)', marginRight: '8px' }}>
                              <input 
                                type="checkbox" 
                                checked={note.isEnabled} 
                                onChange={(e) => updateNote(note.id, 'isEnabled', e.target.checked)} 
                              />
                              <span className={styles.toggleSlider}></span>
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: note.isEnabled ? '#10b981' : '#9ca3af' }}>
                              {note.isEnabled ? 'Включено' : 'Выключено'}
                            </span>
                          </label>
                          <span className={`${styles.noteBadge} ${note.position === 'above' ? styles.noteBadgeAbove : styles.noteBadgeBelow}`}>
                            {note.position === 'above' ? 'Сверху' : 'Снизу'}
                          </span>
                        </div>
                        <button 
                          onClick={() => setGeneralPriceNotes(generalPriceNotes.filter(n => n.id !== note.id))} 
                          className={styles.deleteRowBtn} 
                          title="Удалить примечание"
                        >✕</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <select 
                          value={note.position}
                          onChange={(e) => updateNote(note.id, 'position', e.target.value)}
                          className={styles.priceInput}
                          style={{ width: 'fit-content', fontWeight: '500' }}
                        >
                          <option value="above">Расположение: Сверху таблицы</option>
                          <option value="below">Расположение: Снизу таблицы</option>
                        </select>
                        <textarea 
                          value={note.text}
                          onChange={(e) => updateNote(note.id, 'text', e.target.value)}
                          placeholder="Текст примечания..."
                          className={styles.priceInput}
                          style={{ minHeight: '60px', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        
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
