import React, { useState, useEffect } from 'react';
import { getPpData, updatePpData } from '../../api/client';
import styles from './PpAdminPanel.module.css';

export default function PpAdminPanel({ onDataUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const [priceDate, setPriceDate] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [vatMultiplier, setVatMultiplier] = useState(1.2);
  const [equipmentPassenger, setEquipmentPassenger] = useState([]);
  const [worksPassenger, setWorksPassenger] = useState([]);
  const [equipmentCargo, setEquipmentCargo] = useState([]);
  const [worksCargo, setWorksCargo] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getPpData();
      if (data) {
        setPriceDate(data.priceDate || '');
        setUpdatedAt(data.updatedAt || null);
        setVatMultiplier(data.vatMultiplier !== undefined ? data.vatMultiplier : 1.2);
        setEquipmentPassenger(data.equipmentPassenger || []);
        setWorksPassenger(data.worksPassenger || []);
        setEquipmentCargo(data.equipmentCargo || []);
        setWorksCargo(data.worksCargo || []);
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных ПП:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    try {
      const todayFormatted = new Date().toLocaleDateString('ru-RU');
      const payload = {
        priceDate: todayFormatted,
        vatMultiplier: parseFloat(vatMultiplier) || 1.2,
        equipmentPassenger,
        worksPassenger,
        equipmentCargo,
        worksCargo,
        notes
      };

      const res = await updatePpData(payload);
      setPriceDate(todayFormatted);
      setUpdatedAt(res?.data?.updatedAt || new Date().toISOString());
      setSaveResult({ success: true, message: `Прайс ПП успешно сохранен! Дата действия обновлена на ${todayFormatted}` });
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setSaveResult({ success: false, message: err.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка данных прайса ПП...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Управление прайсом предпусковых подогревателей (ПП)</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {updatedAt ? `Прайс обновлен: ${new Date(updatedAt).toLocaleString('ru-RU')}` : 'Прайс еще не обновлялся'}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveBtn}
        >
          {saving ? 'Сохранение...' : '💾 Сохранить изменения ПП'}
        </button>
      </div>

      {saveResult && (
        <div className={`${styles.resultBanner} ${saveResult.success ? styles.resultSuccess : styles.resultError}`}>
          {saveResult.success ? '✓' : '✗'} {saveResult.message}
        </div>
      )}

      {/* Основные параметры: Дата и НДС */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Базовые настройки прайса</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата действия прайса (обновляется автоматически при сохранении)</label>
            <input
              type="text"
              value={updatedAt ? new Date(updatedAt).toLocaleDateString('ru-RU') : (priceDate || new Date().toLocaleDateString('ru-RU'))}
              readOnly
              style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Коэффициент (ООО «АТС», с НДС 22%)</label>
            <input
              type="number"
              step="0.01"
              value={vatMultiplier}
              onChange={(e) => setVatMultiplier(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* 1. Легковой - Оборудование */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🚗 Легковой: Оборудование</h3>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setEquipmentPassenger([...equipmentPassenger, { id: Date.now(), name: '', price: 0 }])}
          >
            + Добавить позицию
          </button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th>Наименование оборудования</th>
                <th style={{ width: '180px' }}>Цена (руб.)</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Удалить</th>
              </tr>
            </thead>
            <tbody>
              {equipmentPassenger.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className={styles.center}>{idx + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const copy = [...equipmentPassenger];
                        copy[idx].name = e.target.value;
                        setEquipmentPassenger(copy);
                      }}
                      placeholder="Название оборудования"
                      className={styles.input}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const copy = [...equipmentPassenger];
                        copy[idx].price = Number(e.target.value) || 0;
                        setEquipmentPassenger(copy);
                      }}
                      className={styles.input}
                      style={{ textAlign: 'right' }}
                    />
                  </td>
                  <td className={styles.center}>
                    <button
                      type="button"
                      className={styles.delBtn}
                      onClick={() => setEquipmentPassenger(equipmentPassenger.filter((_, i) => i !== idx))}
                      title="Удалить строку"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Легковой - Работы */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🚗 Легковой: Работы</h3>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setWorksPassenger([...worksPassenger, { id: Date.now(), name: '', hours: 1, rate: 2200 }])}
          >
            + Добавить работу
          </button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th>Наименование работы</th>
                <th style={{ width: '120px' }}>Кол-во н/ч</th>
                <th style={{ width: '160px' }}>Ставка н/ч (руб.)</th>
                <th style={{ width: '160px' }}>Итого (авто)</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Удалить</th>
              </tr>
            </thead>
            <tbody>
              {worksPassenger.map((work, idx) => {
                const total = Number(work.hours || 0) * Number(work.rate || 0);
                return (
                  <tr key={work.id || idx}>
                    <td className={styles.center}>{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={work.name}
                        onChange={(e) => {
                          const copy = [...worksPassenger];
                          copy[idx].name = e.target.value;
                          setWorksPassenger(copy);
                        }}
                        placeholder="Название работы"
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        value={work.hours}
                        onChange={(e) => {
                          const copy = [...worksPassenger];
                          copy[idx].hours = parseFloat(e.target.value) || 0;
                          setWorksPassenger(copy);
                        }}
                        className={styles.input}
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="100"
                        value={work.rate}
                        onChange={(e) => {
                          const copy = [...worksPassenger];
                          copy[idx].rate = Number(e.target.value) || 0;
                          setWorksPassenger(copy);
                        }}
                        className={styles.input}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className={styles.totalCell}>
                      {total.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className={styles.center}>
                      <button
                        type="button"
                        className={styles.delBtn}
                        onClick={() => setWorksPassenger(worksPassenger.filter((_, i) => i !== idx))}
                        title="Удалить строку"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Грузовой - Оборудование */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🚚 Грузовой: Оборудование</h3>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setEquipmentCargo([...equipmentCargo, { id: Date.now(), name: '', price: 0 }])}
          >
            + Добавить позицию
          </button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th>Наименование оборудования</th>
                <th style={{ width: '180px' }}>Цена (руб.)</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Удалить</th>
              </tr>
            </thead>
            <tbody>
              {equipmentCargo.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className={styles.center}>{idx + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const copy = [...equipmentCargo];
                        copy[idx].name = e.target.value;
                        setEquipmentCargo(copy);
                      }}
                      placeholder="Название оборудования"
                      className={styles.input}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const copy = [...equipmentCargo];
                        copy[idx].price = Number(e.target.value) || 0;
                        setEquipmentCargo(copy);
                      }}
                      className={styles.input}
                      style={{ textAlign: 'right' }}
                    />
                  </td>
                  <td className={styles.center}>
                    <button
                      type="button"
                      className={styles.delBtn}
                      onClick={() => setEquipmentCargo(equipmentCargo.filter((_, i) => i !== idx))}
                      title="Удалить строку"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Грузовой - Работы */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🚚 Грузовой: Работы</h3>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setWorksCargo([...worksCargo, { id: Date.now(), name: '', hours: 1, rate: 3800 }])}
          >
            + Добавить работу
          </button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th>Наименование работы</th>
                <th style={{ width: '120px' }}>Кол-во н/ч</th>
                <th style={{ width: '160px' }}>Ставка н/ч (руб.)</th>
                <th style={{ width: '160px' }}>Итого (авто)</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Удалить</th>
              </tr>
            </thead>
            <tbody>
              {worksCargo.map((work, idx) => {
                const total = Number(work.hours || 0) * Number(work.rate || 0);
                return (
                  <tr key={work.id || idx}>
                    <td className={styles.center}>{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={work.name}
                        onChange={(e) => {
                          const copy = [...worksCargo];
                          copy[idx].name = e.target.value;
                          setWorksCargo(copy);
                        }}
                        placeholder="Название работы"
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        value={work.hours}
                        onChange={(e) => {
                          const copy = [...worksCargo];
                          copy[idx].hours = parseFloat(e.target.value) || 0;
                          setWorksCargo(copy);
                        }}
                        className={styles.input}
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="100"
                        value={work.rate}
                        onChange={(e) => {
                          const copy = [...worksCargo];
                          copy[idx].rate = Number(e.target.value) || 0;
                          setWorksCargo(copy);
                        }}
                        className={styles.input}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className={styles.totalCell}>
                      {total.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className={styles.center}>
                      <button
                        type="button"
                        className={styles.delBtn}
                        onClick={() => setWorksCargo(worksCargo.filter((_, i) => i !== idx))}
                        title="Удалить строку"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Примечания */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>📝 Примечания к прайсу</h3>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setNotes([...notes, { id: `note-${Date.now()}`, text: '', isEnabled: true }])}
          >
            + Добавить примечание
          </button>
        </div>
        <div className={styles.notesList}>
          {notes.map((note, idx) => (
            <div key={note.id || idx} className={styles.noteRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={note.isEnabled}
                  onChange={(e) => {
                    const copy = [...notes];
                    copy[idx].isEnabled = e.target.checked;
                    setNotes(copy);
                  }}
                />
                <span>Включено</span>
              </label>
              <textarea
                value={note.text}
                onChange={(e) => {
                  const copy = [...notes];
                  copy[idx].text = e.target.value;
                  setNotes(copy);
                }}
                placeholder="Текст примечания..."
                className={styles.textarea}
              />
              <button
                type="button"
                className={styles.delBtn}
                onClick={() => setNotes(notes.filter((_, i) => i !== idx))}
                title="Удалить примечание"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveBtn}
        >
          {saving ? 'Сохранение...' : '💾 Сохранить изменения ПП'}
        </button>
      </div>
    </div>
  );
}
