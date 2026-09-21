import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './PpProposalModal.module.css';

export default function PpProposalModal({
  show,
  onClose,
  category,
  withVat,
  vatMultiplier = 1.2,
  selectedEquipment = [],
  selectedWorks = [],
  priceDate = '15.10.2025',
  totalPrice = 0
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  const multiplier = withVat ? vatMultiplier : 1;

  const formatMoney = (val) => {
    const finalVal = Math.round(Number(val || 0) * multiplier);
    return finalVal.toLocaleString('ru-RU') + ' ₽';
  };

  const categoryName = category === 'cargo' ? 'Грузовой транспорт' : 'Легковой транспорт';

  function handleCopyText() {
    let text = `📋 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ\n`;
    text += `Установка предпусковых подогревателей — EliteGas\n`;
    text += `Тип ТС: ${categoryName}\n`;
    text += `Действительно с: ${priceDate}\n`;
    if (withVat) {
      text += `Условия: ООО "АТС", с НДС 22%\n`;
    } else {
      text += `Условия: ИП, с НДС 5%\n`;
    }
    text += `\n`;

    if (selectedEquipment.length > 0) {
      text += `📦 ОБОРУДОВАНИЕ:\n`;
      selectedEquipment.forEach((item, idx) => {
        text += `${idx + 1}. ${item.name} — ${formatMoney(item.price)}\n`;
      });
      text += `\n`;
    }

    if (selectedWorks.length > 0) {
      text += `🔧 РАБОТЫ:\n`;
      selectedWorks.forEach((work, idx) => {
        const itemTotal = Number(work.hours || 0) * Number(work.rate || 0);
        text += `${idx + 1}. ${work.name} (${work.hours} н/ч) — ${formatMoney(itemTotal)}\n`;
      });
      text += `\n`;
    }

    text += `═════════════════════════\n`;
    text += `ИТОГО К ОПЛАТЕ: ${Math.round(totalPrice).toLocaleString('ru-RU')} ₽\n`;
    text += `\nКонтакты: EliteGas | elitegas.ru`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  }

  function handlePrint() {
    window.print();
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Верхняя панель модалки */}
        <div className={styles.header}>
          <div>
            <span className={styles.categoryBadge}>{categoryName}</span>
            <h2 className={styles.modalTitle}>Коммерческое предложение</h2>
            <span className={styles.modalSubtitle}>Предпусковые подогреватели • EliteGas</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        {/* Тело предложения */}
        <div className={styles.body} id="pp-printable-area">
          <div className={styles.infoMeta}>
            <div>
              <span className={styles.metaLabel}>Цены действительны с:</span>
              <span className={styles.metaValue}>{priceDate}</span>
            </div>
            <div>
              <span className={styles.metaLabel}>Режим расчета:</span>
              <span className={styles.metaValue}>
                {withVat ? 'ООО "АТС", с НДС 22%' : 'ИП, с НДС 5%'}
              </span>
            </div>
          </div>

          {/* Список оборудования */}
          {selectedEquipment.length > 0 && (
            <div className={styles.proposalSection}>
              <h3 className={styles.sectionHeading}>📦 Оборудование</h3>
              <table className={styles.proposalTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>№</th>
                    <th>Наименование</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEquipment.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className={styles.textMuted}>{idx + 1}</td>
                      <td>{item.name}</td>
                      <td className={styles.cellPrice}>{formatMoney(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Список работ */}
          {selectedWorks.length > 0 && (
            <div className={styles.proposalSection}>
              <h3 className={styles.sectionHeading}>🔧 Монтажные работы</h3>
              <table className={styles.proposalTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>№</th>
                    <th>Наименование работы</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Нормо-часы</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWorks.map((work, idx) => {
                    const itemTotal = Number(work.hours || 0) * Number(work.rate || 0);
                    return (
                      <tr key={work.id || idx}>
                        <td className={styles.textMuted}>{idx + 1}</td>
                        <td>{work.name}</td>
                        <td className={styles.textCenter}>{String(work.hours).replace('.', ',')} н/ч</td>
                        <td className={styles.cellPrice}>{formatMoney(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Итоговый расчет */}
          <div className={styles.totalBox}>
            <div className={styles.totalRow}>
              <span className={styles.totalTitle}>ИТОГО К ОПЛАТЕ:</span>
              <span className={styles.totalSum}>
                {Math.round(totalPrice).toLocaleString('ru-RU')} ₽
              </span>
            </div>
            {withVat && (
              <span className={styles.totalVatHint}>
                * Включает НДС (продажа от ООО «АТС» с НДС 22%)
              </span>
            )}
          </div>
        </div>

        {/* Подвал с действиями */}
        <div className={styles.footer}>
          <div className={styles.actionsLeft}>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyText}
            >
              {copied ? '✓ Скопировано в буфер!' : '📋 Скопировать текст для клиента'}
            </button>
            <button
              type="button"
              className={styles.printBtn}
              onClick={handlePrint}
            >
              🖨️ Печать
            </button>
          </div>
          <button
            type="button"
            className={styles.doneBtn}
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
