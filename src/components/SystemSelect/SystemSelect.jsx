import { useMemo } from 'react';
import { formatPrice } from '../../utils/formatters';
import styles from './SystemSelect.module.css';

export default function SystemSelect({ gboFuelType, cylinders, selectedCar, isMetan, selectedSystem, onSelect, priceItems }) {

  const systems = useMemo(() => {
    if (!priceItems || !cylinders) return [];

    const fuelPrefix = gboFuelType === 'METAN' ? 'systemsMetan' : 'systemsPropan';
    
    const categoryKey = `${fuelPrefix}${cylinders}`;
    const fallback = gboFuelType === 'METAN' && cylinders === 4 ? priceItems.systemsMetan || [] : [];
    const items = priceItems[categoryKey] || fallback;

    return [...items].sort((a, b) => {
      const getPriceValue = (sys) => {
        if (sys.price === 'по запросу' || sys.price == null) return Infinity;
        const num = Number(sys.price);
        return isNaN(num) ? Infinity : num;
      };
      return getPriceValue(a) - getPriceValue(b);
    });
  }, [priceItems, cylinders, gboFuelType]);

  if (!cylinders) {
    return (
      <section className={styles.section}>
        <h2 className="section-title">Система ГБО</h2>
        <div className={styles.overlay}>
          <p>Сначала выберите количество цилиндров</p>
        </div>
      </section>
    );
  }

  if (!priceItems) {
    return (
      <section className={styles.section}>
        <h2 className="section-title">Система ГБО</h2>
        <div className={styles.loading}>
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className="section-title">Система ГБО</h2>
      <div className={styles.grid}>
        {systems.map((sys) => (
          <div
            key={sys.id}
            className={`${styles.card} ${selectedSystem?.id === sys.id ? styles.cardActive : ''}`}
            onClick={() => onSelect(sys)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(sys)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.radio}>
                <div className={`${styles.radioInner} ${selectedSystem?.id === sys.id ? styles.radioChecked : ''}`} />
              </div>
              <h3 className={styles.cardName}>{sys.name}</h3>
            </div>

            <div className={styles.cardPrice}>
              {sys.price === 'по запросу' || sys.price == null ? 'По запросу' : formatPrice(sys.price)}
            </div>
          </div>
        ))}
      </div>
      {systems.length === 0 && (
        <div className={styles.overlay}>
          <p>Нет доступных систем для {cylinders} цилиндров</p>
        </div>
      )}
    </section>
  );
}
