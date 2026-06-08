import { useState, useEffect, useMemo } from 'react';
import { getAllCars } from '../../api/client';
import styles from './CarSelect.module.css';

export default function CarSelect({
  cylinders,
  onCylindersChange,
  onCarSelect,
  gboFuelType,
  onFuelTypeChange,
  priceItems,
}) {

  const [carList, setCarList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Fetch all cars on mount
  useEffect(() => {
    let active = true;
    getAllCars()
      .then(data => {
        if (active) {
          setCarList(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const makes = useMemo(() => {
    const uniqueMakes = new Set();
    carList.forEach(car => {
      if (car.brand) uniqueMakes.add(car.brand);
    });
    return Array.from(uniqueMakes).sort();
  }, [carList]);

  const models = useMemo(() => {
    if (!selectedMake) return [];
    return carList
      .filter(car => car.brand === selectedMake)
      .sort((a, b) => (a.model || '').localeCompare(b.model || ''));
  }, [carList, selectedMake]);

  // Handle Make change
  function handleMakeChange(e) {
    const make = e.target.value;
    setSelectedMake(make);
    setSelectedModel('');
    onCarSelect(null);
  }

  // Handle Model change
  function handleModelChange(e) {
    const model = e.target.value;
    setSelectedModel(model);
    
    if (model) {
      const car = models.find(m => m.model === model);
      if (car) {
        onCarSelect(car);
        if (car.cylinders) {
          onCylindersChange(car.cylinders);
        }
      }
    } else {
      onCarSelect(null);
    }
  }

  // Helper to get cylinders of selected model
  const selectedCarData = useMemo(() => {
    if (!selectedModel) return null;
    return models.find(m => m.model === selectedModel) || null;
  }, [selectedModel, models]);

  const cylinderOptions = useMemo(() => {
    if (!priceItems) {
      return gboFuelType === 'METAN' ? [4] : [4, 6, 8];
    }

    const prefix = gboFuelType === 'METAN' ? 'systemsMetan' : 'systemsPropan';
    const values = Object.keys(priceItems)
      .filter((key) => key.startsWith(prefix))
      .map((key) => {
        const suffix = key.slice(prefix.length);
        const num = parseInt(suffix, 10);
        return Number.isFinite(num) ? num : null;
      })
      .filter((value) => value != null);

    if (values.length > 0) {
      return Array.from(new Set(values)).sort((a, b) => a - b);
    }

    return gboFuelType === 'METAN' ? [4] : [4, 6, 8];
  }, [gboFuelType, priceItems]);



  return (
    <section className={styles.section}>
      <h2 className="section-title">Автомобиль</h2>

      <div className={styles.cascadeWrapper}>
        {/* Make Select */}
        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={selectedMake}
            onChange={handleMakeChange}
            disabled={loading}
          >
            <option value="">Выберите марку</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        {/* Model Select */}
        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={selectedModel}
            onChange={handleModelChange}
            disabled={!selectedMake || loading}
          >
            <option value="">Выберите модель</option>
            {models.map((car) => (
              <option key={car.id} value={car.model}>
                {car.model}
              </option>
            ))}
          </select>
        </div>

        {/* Cylinders Read-only */}
        <div className={styles.cylindersDisplay} title="Количество цилиндров">
          {selectedCarData?.cylinders || '-'}
        </div>
      </div>

      <div className={styles.fuelTypeRow}>
        <label className={styles.fuelTypeLabel}>Тип топлива</label>
        <div className={styles.pills}>
          {['PROPAN', 'METAN'].map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.pill} ${
                gboFuelType === type ? styles.pillActive : ''
              }`}
              onClick={() => onFuelTypeChange(type)}
            >
              {type === 'PROPAN' ? 'ПРОПАН' : 'МЕТАН'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.cylinderGroup}>
        <label className={styles.cylinderLabel}>Количество цилиндров</label>
        <div className={styles.pills}>
          {cylinderOptions.map((n) => (
            <button
              key={n}
              type="button"
              id={`cyl-${n}`}
              className={`${styles.pill} ${cylinders === n ? styles.pillActive : ''}`}
              onClick={() => onCylindersChange(n)}
            >
              {n} цил.
            </button>
          ))}
        </div>
        {!cylinders && (
          <p className={styles.warning}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Выберите количество цилиндров для отображения систем
          </p>
        )}
      </div>
    </section>
  );
}
