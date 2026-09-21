import React from 'react';
import styles from './PpStickyFooter.module.css';

export default function PpStickyFooter({
  visible,
  category,
  selectedCount,
  totalPrice,
  onClear,
  onGenerateProposal
}) {
  if (!visible) return null;

  const categoryName = category === 'cargo' ? 'Грузовой' : 'Легковой';

  return (
    <div className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.infoBlock}>
          <div className={styles.badgeWrapper}>
            <span className={styles.categoryBadge}>{categoryName}</span>
            <span className={styles.countBadge}>Выбрано: {selectedCount} поз.</span>
          </div>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Итого:</span>
            <span className={styles.priceValue}>{Math.round(totalPrice).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={onClear}
            title="Снять все отметки"
          >
            Сбросить
          </button>
          <button
            type="button"
            className={styles.proposalBtn}
            onClick={onGenerateProposal}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Сформировать КП
          </button>
        </div>
      </div>
    </div>
  );
}
