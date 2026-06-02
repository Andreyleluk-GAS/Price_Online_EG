import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '../../utils/formatters';
import styles from './SystemSelect.module.css';

export default function SystemSelect({ gboFuelType, cylinders, selectedCar, isMetan, selectedSystem, onSelect, priceItems }) {
  const [pendingSystem, setPendingSystem] = useState(null);
  const [showMismatchModal, setShowMismatchModal] = useState(false);

  // Derive systems from priceItems based on fuel type and cylinder count
  const systems = useMemo(() => {
    if (!priceItems || !cylinders) return [];

    const fuelPrefix = gboFuelType === 'METAN' ? 'systemsMetan' : 'systemsPropan';
    const categoryKey = `${fuelPrefix}${cylinders}`;
    const fallback = gboFuelType === 'METAN' && cylinders === 4 ? priceItems.systemsMetan || [] : [];

    return priceItems[categoryKey] || fallback;
  }, [priceItems, cylinders, gboFuelType]);

  const handleSystemClick = (sys) => {
    const carCylinders = selectedCar?.cylinders;
    if (carCylinders && Number(carCylinders) !== Number(cylinders)) {
      setPendingSystem(sys);
      setShowMismatchModal(true);
    } else {
      onSelect(sys);
    }
  };

  const confirmSelection = () => {
    onSelect(pendingSystem);
    setShowMismatchModal(false);
    setPendingSystem(null);
  };

  const cancelSelection = () => {
    setShowMismatchModal(false);
    setPendingSystem(null);
  };

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
            onClick={() => handleSystemClick(sys)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSystemClick(sys)}
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

      {showMismatchModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Внимание!</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Выбранный автомобиль имеет <strong>{selectedCar?.cylinders}</strong> цилиндров, но вы пытаетесь добавить систему для <strong>{cylinders}</strong> цилиндров. Вы уверены, что хотите продолжить?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                onClick={cancelSelection}
              >
                Отмена
              </button>
              <button
                className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  isMetan ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                }`}
                onClick={confirmSelection}
              >
                Да, всё верно
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
