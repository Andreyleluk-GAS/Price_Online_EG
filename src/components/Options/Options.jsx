import { useState, useMemo } from 'react';
import { formatPrice } from '../../utils/formatters';
import OptionsModal from '../OptionsModal/OptionsModal';
import styles from './Options.module.css';

export default function Options({
  cylinders,
  gboFuelType,
  discountMontage, onDiscountChange,
  gibddDocs, onGibddDocsChange, gibddPrice,
  priceItems,
  selectedExtras, onSaveExtras,
  settings,
}) {
  const [showModal, setShowModal] = useState(false);

  const discountAmount = cylinders === 4 ? 1000 : 2000;

  // Count total selected extras from priceItems
  const extraOptions = useMemo(() => {
    if (!priceItems) return [];
    return (priceItems.extraOptions || []).filter((item) => {
      if (!item || !item.fuelScope) return true;
      return item.fuelScope === 'BOTH' || item.fuelScope === gboFuelType;
    });
  }, [priceItems, gboFuelType]);

  const selectedExtrasList = Object.values(selectedExtras || {});

  // Build summary tags
  const summaryItems = [];
  if (discountMontage) {
    summaryItems.push({ label: 'Скидка «Гибкий график»', value: `-${formatPrice(discountAmount)}`, type: 'discount' });
  }
  if (gibddDocs) {
    summaryItems.push({
      label: 'Подготовка документов для ГИБДД',
      value: `+${formatPrice(Number(settings?.price_gibdd_docs) || 0)}`,
      type: 'extra'
    });
  }
  for (const item of selectedExtrasList) {
    summaryItems.push({
      label: item.name,
      value: item.price != null ? `+${formatPrice(item.price)}` : 'По запросу',
      type: 'extra'
    });
  }

  return (
    <section className={styles.section}>
      <h2 className="section-title">Дополнительные опции</h2>

      {summaryItems.length === 0 ? (
        <button className={styles.selectButton} onClick={() => setShowModal(true)}>
          Опции не выбраны...
        </button>
      ) : (
        <div className={styles.summaryContainer}>
          {/* Левая/Верхняя часть: Названия и Цены */}
          <div className={styles.list}>
            {summaryItems.map((item, i) => (
              <div
                key={i}
                className={styles.listRow}
              >
                <span className={styles.rowLabel}>{item.label}</span>
                <span className={`${styles.rowValue} ${item.type === 'discount' ? styles.rowValueDiscount : styles.rowValueExtra}`}>
                  {item.label.includes('ГИБДД') ? `+${formatPrice(Number(settings?.price_gibdd_docs) || 0)}` : item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Правая/Нижняя часть: Кнопка */}
          <div className={styles.buttonWrap}>
            <button className={styles.changeButton} onClick={() => setShowModal(true)}>
              Изменить
            </button>
          </div>
        </div>
      )}

      <OptionsModal
        show={showModal}
        onClose={() => setShowModal(false)}
        cylinders={cylinders}
        gboFuelType={gboFuelType}
        discountMontage={discountMontage}
        onDiscountChange={onDiscountChange}
        gibddDocs={gibddDocs}
        onGibddDocsChange={onGibddDocsChange}
        gibddPrice={gibddPrice}
        priceItems={priceItems}
        selectedExtras={selectedExtrasList}
        onSaveExtras={onSaveExtras}
        settings={settings}
        isMetan={gboFuelType === 'METAN'}
      />
    </section>
  );
}
