import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatNumber } from '../../utils/formatters';
import styles from './TankModal.module.css';

export default function TankModal({ show, onClose, tanks, selectedTank, onApply, targetOptionIds = [], isMetan }) {
  const [localSelected, setLocalSelected] = useState(selectedTank?.id || null);

  // Sync local selection when modal opens
  useEffect(() => {
    if (show) {
      setLocalSelected(selectedTank?.id || null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show, selectedTank]);

  const handleApply = () => {
    const tank = tanks.find((t) => t.id === localSelected);
    if (tank) {
      onApply(tank);
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalSelected(selectedTank?.id || null);
    onClose();
  };

  const sortedTanks = useMemo(() => {
    return [...tanks].sort((a, b) => {
      const aTarget = targetOptionIds.includes(a.id);
      const bTarget = targetOptionIds.includes(b.id);
      if (aTarget && !bTarget) return -1;
      if (!aTarget && bTarget) return 1;
      return 0;
    });
  }, [tanks, targetOptionIds]);

  if (!show) return null;

  const modal = (
    <div className={`${styles.overlay} ${isMetan ? 'theme-metan' : ''}`} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>Выбор баллона</h2>
              <p className={styles.headerSub}>Выберите тип и размер баллона</p>
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
          <div className={styles.gridContainer}>
            {sortedTanks.map((tank) => {
              const isTarget = targetOptionIds.includes(tank.id);

              return (
                <label key={tank.id} className={styles.tankCard}>
                  <input
                    type="radio"
                    name="tank-selection"
                    value={tank.id}
                    checked={localSelected === tank.id}
                    onChange={(e) => setLocalSelected(e.target.value)}
                    className={styles.radioInput}
                  />
                  <div className={`${styles.card} ${localSelected === tank.id ? styles.cardSelected : ''}`}>
                    <div className={styles.cardContent}>
                      <h3 className={styles.tankName}>
                        {(tank.name || '').replace(/\[.*?\]/g, '').trim()}
                        {isTarget && (
                          <span className={styles.verifiedBadge}>
                            ✅ Проверено
                          </span>
                        )}
                      </h3>
                      <div className={styles.tankPrice}>
                        {tank.price == null ? (
                          <span className={styles.priceRequest}>По запросу</span>
                        ) : tank.price === 0 ? (
                          <span className={styles.priceZero}>Без доплаты</span>
                        ) : (
                          <span className={tank.price < 0 ? styles.priceNegative : styles.priceValue}>
                            {tank.price > 0 ? '+' : ''}{formatNumber(tank.price)} ₽
                          </span>
                        )}
                      </div>
                    </div>
                    {localSelected === tank.id && (
                      <div className={styles.checkmark}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Отмена
          </button>
          <button
            className={styles.applyButton}
            onClick={handleApply}
            disabled={!localSelected}
          >
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
