import { formatPrice, formatMonths } from '../../utils/formatters';
import styles from './SavingsCalc.module.css';

export default function SavingsCalc({
  fuelType, onFuelTypeChange,
  consumption, onConsumptionChange,
  mileage, onMileageChange,
  petrolCost, gasCost, monthlySavings, paybackMonths,
}) {
  return (
    <section className={styles.section}>
      <h2 className="section-title">Расчёт окупаемости</h2>

      <div className={styles.controls}>
        <div className={styles.fuelToggle}>
          <label className={styles.fieldLabel}>Тип топлива</label>
          <div className={styles.pills}>
            <button
              type="button"
              id="fuel-92"
              className={`${styles.pill} ${fuelType === '92' ? styles.pillActive : ''}`}
              onClick={() => onFuelTypeChange('92')}
            >
              АИ-92
            </button>
            <button
              type="button"
              id="fuel-95"
              className={`${styles.pill} ${fuelType === '95' ? styles.pillActive : ''}`}
              onClick={() => onFuelTypeChange('95')}
            >
              АИ-95
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.fieldLabel} htmlFor="consumption">Средний расход, л/100 км</label>
          <input
            type="number"
            id="consumption"
            value={consumption}
            onChange={(e) => onConsumptionChange(parseFloat(e.target.value) || 0)}
            min="1"
            max="50"
            step="0.1"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.fieldLabel} htmlFor="mileage">Пробег в месяц, км</label>
          <input
            type="number"
            id="mileage"
            value={mileage}
            onChange={(e) => onMileageChange(parseInt(e.target.value) || 0)}
            min="100"
            max="50000"
            step="100"
          />
        </div>
      </div>

      <div className={styles.results}>
        <div className={styles.expensesBox}>
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Затраты на бензин:</span>
            <span className={styles.resultValue}>{formatPrice(petrolCost)}/мес</span>
          </div>
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Затраты на газ:</span>
            <span className={styles.resultValue}>{formatPrice(gasCost)}/мес</span>
          </div>
        </div>
        
        <div className={styles.highlightsBox}>
          <div className={styles.highlightItem}>
            <span className={styles.highlightLabel}>Экономия</span>
            <span className={styles.savingsValue}>
              {monthlySavings > 0 ? formatPrice(monthlySavings).replace(' ₽', '') : '0'} 
              <span className={styles.perMonth}>₽/мес</span>
            </span>
          </div>
          <div className={styles.highlightItem}>
            <span className={styles.highlightLabel}>Окупаемость</span>
            <span className={styles.paybackValue}>{formatMonths(paybackMonths)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
