import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '../../utils/formatters';
import styles from './OptionsModal.module.css';

export default function OptionsModal({
  show,
  onClose,
  cylinders,
  gboFuelType,
  discountMontage, onDiscountChange,
  gibddDocs, onGibddDocsChange,
  gibddPrice,
  priceItems,
  selectedExtras, onSaveExtras,
  settings,
  isMetan,
  selectedSystem,
}) {
  // Local state copies — commit on Apply, revert on Cancel
  const [localDiscount, setLocalDiscount] = useState(discountMontage);
  const [localGibdd, setLocalGibdd] = useState(gibddDocs);
  const [localExtras, setLocalExtras] = useState(selectedExtras || []);

  const discountAmount = cylinders === 4 ? 1000 : 2000;

  // Sync local state when modal opens
  useEffect(() => {
    if (show) {
      setLocalDiscount(discountMontage);
      setLocalGibdd(gibddDocs);
      setLocalExtras(selectedExtras || []);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show, discountMontage, gibddDocs, selectedExtras]);

  const extraOptions = useMemo(() => {
    if (!priceItems) return [];
    return (priceItems.extraOptions || [])
      .filter(item => item.optionCategory !== 'Y')
      .map(item => {
      // Защита для ГИБДД если она вдруг попадет в массив
      if (item.name && item.name.includes('ГИБДД')) {
        return { ...item, price: Number(settings?.price_gibdd_docs) || 0 };
      }
      return item;
    }).filter((item) => {
      if (!item || !item.fuelScope) return true;
      return item.fuelScope === 'BOTH' || item.fuelScope === gboFuelType;
    }).filter((item) => {
      const tags = item.name ? (item.name.match(/\[(.*?)\]/g) || []) : [];
      if (tags.length === 0) return true;

      const systemCodePrefix = selectedSystem?.id?.substring(0, 3);
      if (!systemCodePrefix) return false;

      return tags.some(tag => tag.includes(systemCodePrefix));
    });
  }, [priceItems, gboFuelType, settings?.price_gibdd_docs, selectedSystem]);

  function toggleLocalExtra(item) {
    setLocalExtras((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const exists = arr.some(x => x.id === item.id);
      if (exists) {
        return arr.filter(x => x.id !== item.id);
      }
      return [...arr, item];
    });
  }

  function handleApply() {
    onDiscountChange(localDiscount);
    onGibddDocsChange(localGibdd);

    // Sync extras: directly save the full array of selected options
    if (onSaveExtras) {
      onSaveExtras(localExtras);
    }

    onClose();
  }

  function handleCancel() {
    onClose();
  }

  // Count selected options for badge
  const selectedCount =
    (localDiscount ? 1 : 0) +
    (localGibdd ? 1 : 0) +
    (Array.isArray(localExtras) ? localExtras.length : 0);

  if (!show) return null;

  const modal = (
    <div className={`${styles.overlay} ${isMetan ? 'theme-metan' : ''}`} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>Дополнительные опции</h2>
              <p className={styles.headerSub}>
                {selectedCount > 0 ? `Выбрано: ${selectedCount}` : 'Настройте параметры'}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleCancel} aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Скидка за монтаж */}
          <div className={styles.optionGroup}>
            <h3 className={styles.groupTitle}>Скидки и документы</h3>

            <label className={styles.checkRow} htmlFor="modal-discount">
              <div className={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  id="modal-discount"
                  checked={localDiscount}
                  onChange={(e) => setLocalDiscount(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <div className={`${styles.checkbox} ${localDiscount ? styles.checked : ''}`}>
                  {localDiscount && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </div>
              </div>
              <div className={styles.checkLabel}>
                <span className={styles.optionName}>Скидка «Гибкий график» [монтаж в течении 2 рабочих дней]</span>
                <span className={`${styles.discountBadge} ${localDiscount ? styles.discountBadgeActive : ''}`}>
                  -{formatPrice(discountAmount)}
                </span>
              </div>
            </label>

            <label className={styles.checkRow} htmlFor="modal-gibdd">
              <div className={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  id="modal-gibdd"
                  checked={localGibdd}
                  onChange={(e) => setLocalGibdd(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <div className={`${styles.checkbox} ${localGibdd ? styles.checked : ''}`}>
                  {localGibdd && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </div>
              </div>
              <div className={styles.checkLabelExtra}>
                <span className={styles.optionName}>Подготовка документов для ГИБДД</span>
                <span className={`${styles.extraPrice} ${localGibdd ? styles.extraPriceActive : ''}`}>
                  +{formatPrice(Number(settings?.price_gibdd_docs) || 0)}
                </span>
              </div>
            </label>
          </div>

          {/* Дополнительные опции из прайса */}
          {extraOptions.length > 0 && (
            <div className={styles.optionGroup}>
              <h3 className={styles.groupTitle}>Дополнительное оборудование</h3>
              {extraOptions.map((item) => (
                <label
                  key={item.id}
                  className={styles.checkRow}
                  htmlFor={`modal-extra-${item.id}`}
                >
                  <div className={styles.checkboxWrap}>
                    <input
                      type="checkbox"
                      id={`modal-extra-${item.id}`}
                      checked={Array.isArray(localExtras) && localExtras.some(x => x.id === item.id)}
                      onChange={() => toggleLocalExtra(item)}
                      className={styles.checkboxInput}
                    />
                    <div className={`${styles.checkbox} ${Array.isArray(localExtras) && localExtras.some(x => x.id === item.id) ? styles.checked : ''}`}>
                      {Array.isArray(localExtras) && localExtras.some(x => x.id === item.id) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f1117" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className={styles.checkLabelExtra}>
                    <div className={styles.extraTextBlock}>
                      <span className={styles.optionName}>{(item.name || '').replace(/\[.*?\]/g, '').trim()}</span>
                    </div>
                    <span className={`${styles.extraPrice} ${(Array.isArray(localExtras) && localExtras.some(x => x.id === item.id)) ? styles.extraPriceActive : ''}`}>
                      {item.price != null ? formatPrice(item.price) : 'По запросу'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Отмена
          </button>
          <button className={styles.applyButton} onClick={handleApply}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Применить
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
