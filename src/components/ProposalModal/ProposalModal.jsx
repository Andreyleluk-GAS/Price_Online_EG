import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { formatPrice, formatMonths, formatDate } from '../../utils/formatters';
import { EliteGasLogo } from '../EliteGasLogo';
import styles from './ProposalModal.module.css';

export default function ProposalModal({
  show, onClose,
  selectedCar, cylinders, gboFuelType, selectedSystem, selectedTank,
  discountMontage, discount, gibddDocs, gibddPrice,
  totalPrice, petrolCost, gasCost, monthlySavings, paybackMonths,
  fuelType, selectedExtras, settings,
  consumption, mileage,
}) {
  const extrasList = selectedExtras ? Object.values(selectedExtras) : [];
  const [toastMessage, setToastMessage] = useState(null);
  const captureRef = useRef(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const baseOptions = useMemo(() => {
    const baseOptionsPropane = ["Мультиклапан европа", "Магистраль сталь", "Заправочное устройство", "Размещение баллона - внутри"];
    const baseOptionsMethane = ["Заправочное устройство", "Манометр механический", "Баллонный вентиль", "Электромагнитный клапан"];

    if (gboFuelType === 'METAN') {
      const hasElectronicManometer = (extrasList || []).some(
        (item) => item?.id && typeof item.id === 'string' && item.id.startsWith('MDOP') && item.id.endsWith('001')
      );
      if (hasElectronicManometer) {
        return baseOptionsMethane.filter(opt => opt !== "Манометр механический");
      }
      return baseOptionsMethane;
    }

    const hasBottomTank = (extrasList || []).some(
      (item) => (item?.name || '').includes('Установка баллона снизу') || (item?.id && typeof item.id === 'string' && item.id.includes('PDOP') && item.id.includes('001'))
    );
    if (hasBottomTank) {
      return baseOptionsPropane.filter(opt => opt !== "Размещение баллона - внутри");
    }

    return baseOptionsPropane;
  }, [gboFuelType, extrasList]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const carLabel = selectedCar
    ? (selectedCar.model ? `${selectedCar.brand} ${selectedCar.model}` : selectedCar.brand)
    : 'Не указан';

  const today = formatDate(new Date().toISOString());

  function getPlainText() {
    const fuelLabel = gboFuelType === 'METAN' ? 'МЕТАН' : 'ПРОПАН';
    let text = `🔧 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ — ГБО (${fuelLabel})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🚗 Автомобиль: ${carLabel} (${cylinders || '?'} цил.)\n`;
    text += `⚙️ Система: ${selectedSystem?.name || '—'}\n`;
    if (selectedSystem && baseOptions && Array.isArray(baseOptions)) {
      text += `  Включает: ${baseOptions.join(', ')}\n`;
    }
    text += `🔴 Баллон: ${selectedTank?.name || '—'}\n`;
    if (discountMontage) {
      text += `🏷 Скидка «Гибкий график»: -${discount} ₽\n`;
    }
    if (gibddDocs) {
      text += `📋 Комплект документов для ГИБДД: Включено\n`;
    }
    
    if (extrasList.length > 0) {
      const negativeExtras = extrasList.filter(item => item.price < 0);
      const regularExtras = extrasList.filter(item => item.price >= 0 || item.price === 'по запросу' || item.price == null);

      if (regularExtras.length > 0) {
        text += `🔧 Доп. опции:\n`;
        for (const item of regularExtras) {
          text += `  📋 ${(item.name || '').replace(/\[.*?\]/g, '').trim()}: Включено\n`;
        }
      }
      
      for (const item of negativeExtras) {
        text += `🏷 ${(item.name || '').replace(/\[.*?\]/g, '').trim()}: ${formatPrice(item.price)}\n`;
      }
    }

    text += `\n💰 ИТОГО: ${totalPrice != null ? formatPrice(totalPrice) : 'По запросу'}\n`;
    text += `\n📊 Окупаемость:\n`;
    text += `  Расчет при расходе ${consumption} л/100 км и пробеге ${mileage} км/мес\n`;
    text += `  Затраты на бензин: ${formatPrice(petrolCost)}/мес\n`;
    text += `  Затраты на газ: ${formatPrice(gasCost)}/мес\n`;
    text += `  Экономия: ${formatPrice(monthlySavings)}/мес\n`;
    text += `  Окупится за: ${formatMonths(paybackMonths)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━`;
    return text;
  }

  async function handleCopy() {
    if (!captureRef.current) return;
    
    setToastMessage('Формируем картинку...');
    
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#FFFFFF', // Ensure white background
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setToastMessage('Ошибка при создании картинки');
          return;
        }
        
        try {
          if (navigator.clipboard && window.isSecureContext) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setToastMessage('Картинка скопирована!');
          } else {
            // Fallback: download if clipboard API is not fully supported
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Предложение_ГБО.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setToastMessage('Картинка сохранена (скачана)!');
          }
        } catch (err) {
          console.error('Clipboard copy failed, downloading instead...', err);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Предложение_ГБО.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setToastMessage('Картинка сохранена (скачана)!');
        }
      }, 'image/png');
    } catch (err) {
      console.error('html2canvas error:', err);
      setToastMessage('Ошибка при создании картинки');
    }
  }

  return createPortal(
    <div className={`${styles.overlay} ${gboFuelType === 'METAN' ? 'theme-metan' : ''}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div ref={captureRef} className={styles.captureArea}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Коммерческое предложение</h2>
            <p className={styles.headerDate}>{today}</p>
          </div>

          <div className={styles.body}>
            <div className={styles.watermark}>
              <EliteGasLogo size={256} />
            </div>

            <div className={styles.row}>
              <span className={styles.label}>🚗 Автомобиль</span>
              <span className={styles.value}>{carLabel} ({cylinders || '?'} цил.)</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>⛽ Тип газа</span>
              <span className={styles.value}>{gboFuelType === 'METAN' ? 'МЕТАН' : 'ПРОПАН'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>⚙️ Система ГБО</span>
              <span className={styles.value}>{selectedSystem?.name || '—'}</span>
            </div>
            <div className={styles.rowSub}>
              <span>Базовая цена</span>
              <span>{selectedSystem?.price != null ? formatPrice(selectedSystem.price) : 'По запросу'}</span>
            </div>
            {selectedSystem && baseOptions && Array.isArray(baseOptions) && (
              <div className={styles.baseOptions}>
                <ul className={styles.baseOptionsList}>
                  {baseOptions.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.row}>
              <span className={styles.label}>🛢 Баллон</span>
              <span className={styles.value}>{selectedTank?.name || '—'}</span>
            </div>
            {selectedTank && selectedTank.price > 0 && (
              <div className={styles.rowSub}>
                <span>Доплата</span>
                <span>+{formatPrice(selectedTank.price)}</span>
              </div>
            )}

            {(discountMontage || gibddDocs || extrasList.length > 0) && (
              <div className={styles.row}>
                <span className={styles.label}>📋 Дополнительно</span>
                <span></span>
              </div>
            )}
            {discountMontage && (
              <div className={styles.rowSub}>
                <span>Скидка «Гибкий график»</span>
                <span className={styles.discountText}>-{formatPrice(discount)}</span>
              </div>
            )}
            {gibddDocs && (
              <div className={styles.rowSub}>
                <span>ГИБДД (документы)</span>
                <span>{Number(settings?.price_gibdd_docs) === 0 ? 'Включено' : `+${formatPrice(Number(settings?.price_gibdd_docs) || 0)}`}</span>
              </div>
            )}
            {extrasList.map((item) => (
              <div key={item.id} className={styles.rowSub}>
                <span>{(item.name || '').replace(/\[.*?\]/g, '').trim()}</span>
                <span>{item.price != null ? `+${formatPrice(item.price)}` : 'По запросу'}</span>
              </div>
            ))}

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>ИТОГО</span>
              <span className={styles.totalValue}>
                {totalPrice != null ? formatPrice(totalPrice) : 'По запросу'}
              </span>
            </div>

            <div className={styles.savingsBlock}>
              <h3 className={styles.savingsTitle}>📊 Расчёт окупаемости</h3>
              <div style={{ color: '#000000', fontSize: '0.85rem', marginBottom: '12px', fontWeight: '500' }}>
                Расчет при расходе {consumption} л/100 км и пробеге {mileage} км/мес
              </div>
              <div className={styles.savingsRow}>
                <span>Затраты на бензин (АИ-{fuelType})</span>
                <span>{formatPrice(petrolCost)}/мес</span>
              </div>
              <div className={styles.savingsRow}>
                <span>Затраты на газ</span>
                <span>{formatPrice(gasCost)}/мес</span>
              </div>
              <div className={styles.savingsRow}>
                <span>Экономия</span>
                <span className={styles.savingsHighlight}>{formatPrice(monthlySavings)}/мес</span>
              </div>
              <div className={styles.savingsRow}>
                <span>Окупаемость</span>
                <span className={styles.paybackHighlight}>{formatMonths(paybackMonths)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={handleCopy}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Скопировать
          </button>
          <button className={styles.closeBtnSecondary} onClick={onClose}>
            Закрыть
          </button>
        </div>

        {toastMessage && (
          <div className={styles.toast}>
            {toastMessage === 'Текст скопирован!' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.toastIcon}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
