import React, { useState, useEffect } from 'react';
import styles from './ManualPriceModal.module.css';
import { getPriceItems, updatePriceItems } from '../../api/client';

const CATEGORIES_TRANSLATION = {
  systemsPropan4: 'Комплекты 4 цил.',
  systemsPropan6: 'Комплекты 6 цил.',
  systemsPropan8: 'Комплекты 8 цил.',
  systemsMetan4: 'Комплекты 4 цил.',
  systemsMetan6: 'Комплекты 6 цил.',
  systemsMetan8: 'Комплекты 8 цил.',
  optionsPropanTanks: 'Баллоны',
  optionsMetanTanks: 'Баллоны',
  extraOptions: 'Доп. опции',
  systemsMetan: 'Системы Метан (база)'
};

export default function ManualPriceModal({ isOpen, onClose }) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPrices();
    } else {
      setPriceData(null);
      setError(null);
      setSelectedCategory(null);
    }
  }, [isOpen]);

  async function loadPrices() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPriceItems();
      setPriceData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(category, itemIndex, field, value) {
    setPriceData((prev) => {
      const newData = { ...prev };
      const newItems = [...newData[category]];
      
      let newValue = value;
      if (field === 'price') {
        if (value.trim() !== '') {
          if (value.trim() === '!') {
            newValue = '!';
          } else {
            const parsed = parseInt(value, 10);
            if (!isNaN(parsed)) {
              newValue = parsed;
            } else {
              newValue = null;
            }
          }
        } else {
          newValue = null;
        }
      }

      newItems[itemIndex] = {
        ...newItems[itemIndex],
        [field]: newValue
      };
      
      newData[category] = newItems;
      return newData;
    });
  }

  function handleBaseTankChange(category, selectedIdx) {
    setPriceData((prev) => {
      const newData = { ...prev };
      const newItems = newData[category].map((item, idx) => {
        let newName = item.name || '';
        const hasY = newName.includes('[Y]');
        
        if (idx === selectedIdx) {
          if (!hasY) {
            newName = newName.trim() + ' [Y]';
          }
        } else {
          if (hasY) {
            newName = newName.replace(/\[Y\]/g, '').trim();
          }
        }
        return { ...item, name: newName };
      });
      
      newData[category] = newItems;
      return newData;
    });
  }

  const isTankCategory = selectedCategory === 'optionsPropanTanks' || selectedCategory === 'optionsMetanTanks';

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updatePriceItems(priceData);
      onClose(true); // pass true to indicate it was saved
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => onClose(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Ручная корректировка цен</h2>
          <button className={styles.closeBtn} onClick={() => onClose(false)}>&times;</button>
        </div>
        
        <div className={styles.content}>
          {loading ? (
            <p className={styles.loading}>Загрузка...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : priceData && !selectedCategory ? (
            <div className={styles.categoryMenu}>
              <div>
                <div className={styles.categoryGroupTitle}>ПРОПАН</div>
                <div className={styles.categoryGroup}>
                  {['systemsPropan4', 'systemsPropan6', 'systemsPropan8', 'optionsPropanTanks'].map((categoryKey) => {
                    if (!priceData[categoryKey] || !Array.isArray(priceData[categoryKey])) return null;
                    return (
                      <button 
                        key={categoryKey} 
                        className={`${styles.categoryCard} ${styles[categoryKey] || ''}`}
                        onClick={() => setSelectedCategory(categoryKey)}
                      >
                        {CATEGORIES_TRANSLATION[categoryKey] || categoryKey}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className={styles.categoryGroupTitle}>МЕТАН</div>
                <div className={styles.categoryGroup}>
                  {['systemsMetan4', 'systemsMetan6', 'systemsMetan8', 'optionsMetanTanks'].map((categoryKey) => {
                    if (!priceData[categoryKey] || !Array.isArray(priceData[categoryKey])) return null;
                    return (
                      <button 
                        key={categoryKey} 
                        className={`${styles.categoryCard} ${styles[categoryKey] || ''}`}
                        onClick={() => setSelectedCategory(categoryKey)}
                      >
                        {CATEGORIES_TRANSLATION[categoryKey] || categoryKey}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : priceData && selectedCategory ? (
            <div className={styles.tableContainer}>
              <table className={styles.excelTable}>
                <thead>
                  <tr>
                    <th className={styles.colId}>ID</th>
                    <th className={styles.colName}>Наименование</th>
                    {isTankCategory && <th className={styles.colBase}>Базовая</th>}
                    <th className={styles.colPrice}>Цена для прайса онлайн</th>
                    <th className={styles.colHide}>Скрыть</th>
                  </tr>
                </thead>
                <tbody>
                  {priceData[selectedCategory] && priceData[selectedCategory].map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className={styles.cellId}>{item.id || ''}</td>
                      <td className={styles.cellName}>
                        <textarea
                          className={styles.nameInput}
                          value={item.name || ''}
                          onChange={(e) => handleChange(selectedCategory, idx, 'name', e.target.value)}
                        />
                      </td>
                      {isTankCategory && (
                        <td className={styles.cellBase}>
                          <input
                            type="radio"
                            name={`baseTank_${selectedCategory}`}
                            className={styles.baseRadio}
                            checked={(item.name || '').includes('[Y]')}
                            onChange={() => handleBaseTankChange(selectedCategory, idx)}
                            title={item.price === '!' ? "Нельзя сделать скрытую опцию базовой" : "Сделать базовой опцией"}
                            disabled={item.price === '!'}
                          />
                        </td>
                      )}
                      <td className={styles.cellPrice}>
                        <input
                          type={item.price === '!' ? 'text' : 'number'}
                          className={styles.priceInput}
                          value={item.price == null ? '' : item.price}
                          onChange={(e) => handleChange(selectedCategory, idx, 'price', e.target.value)}
                          placeholder="По запросу"
                          disabled={item.price === '!'}
                        />
                      </td>
                      <td className={styles.cellHide}>
                        <input
                          type="checkbox"
                          className={styles.hideCheckbox}
                          checked={item.price === '!'}
                          onChange={(e) => handleChange(selectedCategory, idx, 'price', e.target.checked ? '!' : '')}
                          title="Скрыть позицию"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className={styles.footer}>
          {selectedCategory && (
            <button className="btn-secondary" onClick={() => setSelectedCategory(null)} disabled={saving}>
              Назад к разделам
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button className="btn-secondary" onClick={() => onClose(false)} disabled={saving}>
            Закрыть без сохранения
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  );
}
