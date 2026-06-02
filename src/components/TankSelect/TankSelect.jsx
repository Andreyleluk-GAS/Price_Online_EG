import { useMemo, useState } from 'react';
import { formatNumber } from '../../utils/formatters';
import TankModal from '../TankModal/TankModal';
import styles from './TankSelect.module.css';

export default function TankSelect({ gboFuelType, selectedTank, onSelect, priceItems, targetBalloonsIds = [] }) {
  const [showModal, setShowModal] = useState(false);

  // Derive tanks from priceItems by fuel type
  const tanks = useMemo(() => {
    if (!priceItems) return [];
    return gboFuelType === 'METAN'
      ? priceItems.optionsMetanTanks || []
      : priceItems.optionsPropanTanks || [];
  }, [priceItems, gboFuelType]);

  const handleApply = (tank) => {
    onSelect(tank);
    setShowModal(false);
  };

  const handleChange = () => {
    setShowModal(true);
  };

  return (
    <section className={styles.section}>
      <h2 className="section-title">Баллон</h2>

      {!selectedTank ? (
        <button className={styles.selectButton} onClick={() => setShowModal(true)}>
          Выберите баллон...
        </button>
      ) : (
        <div className={styles.selectedContainer}>
          {/* Левая/Верхняя часть: Названия и Цены */}
          <div className={styles.selectedInfo}>
            <div className={styles.rowContainer}>
              <span className={styles.selectedName}>
                {selectedTank.name}
              </span>
              <span className={styles.selectedPrice}>
                {selectedTank.price == null ? (
                  'По запросу'
                ) : selectedTank.price === 0 ? (
                  'Без доплаты'
                ) : (
                  `+${formatNumber(selectedTank.price)} ₽`
                )}
              </span>
            </div>
          </div>

          {/* Правая/Нижняя часть: Кнопка */}
          <div className={styles.buttonWrap}>
            <button className={styles.changeButton} onClick={handleChange}>
              Изменить
            </button>
          </div>
        </div>
      )}

      <TankModal
        show={showModal}
        onClose={() => setShowModal(false)}
        tanks={tanks}
        selectedTank={selectedTank}
        onApply={handleApply}
        targetBalloonsIds={targetBalloonsIds}
        isMetan={gboFuelType === 'METAN'}
      />
    </section>
  );
}
