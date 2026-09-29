import React, { useState, useMemo } from 'react';
import ppLogo from '../../assets/pp.png';
import PpStickyFooter from './PpStickyFooter';
import PpProposalModal from './PpProposalModal';
import styles from './PpPriceView.module.css';

export default function PpPriceView({ data, loading }) {
  const [withVat, setWithVat] = useState(false);
  const [selectedPassengerEq, setSelectedPassengerEq] = useState([]);
  const [selectedPassengerWorks, setSelectedPassengerWorks] = useState([]);
  const [selectedCargoEq, setSelectedCargoEq] = useState([]);
  const [selectedCargoWorks, setSelectedCargoWorks] = useState([]);
  const [showProposal, setShowProposal] = useState(false);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Загрузка прайса на предпусковые подогреватели...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyWrapper}>
          <p>Прайс на предпусковые подогреватели временно недоступен.</p>
        </div>
      </div>
    );
  }

  const vatMultiplier = Number(data.vatMultiplier) || 1.2;
  const multiplier = withVat ? vatMultiplier : 1;

  // Helper formatting function
  const displayDate = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString('ru-RU')
    : (data.priceDate || new Date().toLocaleDateString('ru-RU'));

  const formatMoney = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    const finalVal = Math.round(Number(val) * multiplier);
    return finalVal.toLocaleString('ru-RU') + ' ₽';
  };

  const formatHours = (val) => {
    if (val === undefined || val === null) return '—';
    return String(val).replace('.', ',');
  };

  const equipmentPassenger = data.equipmentPassenger || [];
  const worksPassenger = data.worksPassenger || [];
  const equipmentCargo = data.equipmentCargo || [];
  const worksCargo = data.worksCargo || [];
  const activeNotes = (data.notes || []).filter(n => n.isEnabled);
  const aboveNotes = activeNotes.filter(n => n.position === 'above');
  const belowNotes = activeNotes.filter(n => !n.position || n.position === 'below');

  // Selection mutual exclusion logic
  const hasPassengerSelected = selectedPassengerEq.length > 0 || selectedPassengerWorks.length > 0;
  const hasCargoSelected = selectedCargoEq.length > 0 || selectedCargoWorks.length > 0;
  const isSelectionActive = hasPassengerSelected || hasCargoSelected;

  const togglePassengerEq = (id) => {
    if (hasCargoSelected) return;
    setSelectedPassengerEq(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const togglePassengerWork = (id) => {
    if (hasCargoSelected) return;
    setSelectedPassengerWorks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCargoEq = (id) => {
    if (hasPassengerSelected) return;
    setSelectedCargoEq(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCargoWork = (id) => {
    if (hasPassengerSelected) return;
    setSelectedCargoWorks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearAllSelections = () => {
    setSelectedPassengerEq([]);
    setSelectedPassengerWorks([]);
    setSelectedCargoEq([]);
    setSelectedCargoWorks([]);
  };

  // Calculate selected items and total price
  const selectedItems = useMemo(() => {
    if (hasCargoSelected) {
      const eq = equipmentCargo.filter(item => selectedCargoEq.includes(item.id));
      const works = worksCargo.filter(item => selectedCargoWorks.includes(item.id));
      const eqSum = eq.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
      const worksSum = works.reduce((acc, it) => acc + (Number(it.hours || 0) * Number(it.rate || 0)), 0);
      const total = (eqSum + worksSum) * multiplier;
      return {
        category: 'cargo',
        equipment: eq,
        works: works,
        count: eq.length + works.length,
        total
      };
    } else if (hasPassengerSelected) {
      const eq = equipmentPassenger.filter(item => selectedPassengerEq.includes(item.id));
      const works = worksPassenger.filter(item => selectedPassengerWorks.includes(item.id));
      const eqSum = eq.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
      const worksSum = works.reduce((acc, it) => acc + (Number(it.hours || 0) * Number(it.rate || 0)), 0);
      const total = (eqSum + worksSum) * multiplier;
      return {
        category: 'passenger',
        equipment: eq,
        works: works,
        count: eq.length + works.length,
        total
      };
    }
    return {
      category: 'passenger',
      equipment: [],
      works: [],
      count: 0,
      total: 0
    };
  }, [hasCargoSelected, hasPassengerSelected, selectedPassengerEq, selectedPassengerWorks, selectedCargoEq, selectedCargoWorks, equipmentPassenger, worksPassenger, equipmentCargo, worksCargo, multiplier]);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper} style={{ paddingBottom: isSelectionActive ? '70px' : '0' }}>
        
        {/* Верхняя панель заголовка и переключателей */}
        <div className={styles.headerBlock}>
          <div className={styles.titleArea}>
            <img 
              src={ppLogo} 
              alt="Прайс на установку предпусковых подогревателей" 
              className={styles.titleImage} 
            />
          </div>

          <div className={styles.headerControls}>
            {/* Бейдж даты */}
            <div className={styles.dateBadge}>
              <span className={styles.dateLabel}>ЦЕНЫ ДЕЙСТВИТЕЛЬНЫ С:</span>
              <span className={styles.dateValue}>{displayDate}</span>
            </div>

            {/* Интерактивный переключатель НДС */}
            <div className={styles.vatToggleWrapper} title="Корректировка цен при продаже с НДС от ООО 'АТС'">
              <span className={`${styles.vatLabel} ${!withVat ? styles.vatLabelActive : ''}`}>
                ИП, с НДС 5%
              </span>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${withVat ? styles.toggleSwitchActive : ''}`}
                onClick={() => setWithVat(!withVat)}
                aria-label="Переключить расчет с НДС"
              >
                <span className={styles.toggleThumb}></span>
              </button>
              <span className={`${styles.vatLabel} ${withVat ? styles.vatLabelActive : ''}`}>
                ООО "АТС", с НДС 22%
              </span>
            </div>
          </div>
        </div>

        {withVat && (
          <div className={styles.vatAlertBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Цены в таблицах указаны при продаже от ООО «АТС» с НДС 22%</span>
          </div>
        )}

        {/* Примечания СВЕРХУ */}
        {aboveNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {aboveNotes.map((note, idx) => {
              const lines = note.text.split('\n');
              const title = lines.shift();
              return (
                <div key={note.id || idx} className={styles.topNote}>
                  {title && <span className={styles.topNoteTitle}>{title}</span>}
                  {lines.map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* 1. Блок ЛЕГКОВОЙ ТРАНСПОРТ */}
        <div className={`${styles.sectionCard} ${hasCargoSelected ? styles.sectionDisabled : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>🚗</div>
            <div>
              <h2 className={styles.sectionTitle}>Легковой транспорт</h2>
              <span className={styles.sectionSubtitle}>Оборудование и монтажные работы для легковых автомобилей</span>
            </div>
            {hasCargoSelected && (
              <span className={styles.disabledBadge}>
                🔒 Выбран грузовой транспорт
              </span>
            )}
          </div>

          {/* Оборудование (легковой) */}
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>Оборудование (легковой)</h3>
            <div className={styles.tableResponsive}>
              <table className={styles.priceTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>№</th>
                    <th>Оборудование</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Цена</th>
                    <th className={styles.checkboxHeader} title="Выбрать для расчета КП">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentPassenger.map((item, idx) => {
                    const isChecked = selectedPassengerEq.includes(item.id);
                    return (
                      <tr
                        key={item.id || idx}
                        className={isChecked ? styles.selectedRow : ''}
                        onClick={() => !hasCargoSelected && togglePassengerEq(item.id)}
                        style={{ cursor: hasCargoSelected ? 'not-allowed' : 'pointer' }}
                      >
                        <td className={styles.centerCol}>{idx + 1}</td>
                        <td className={styles.nameCol}>{item.name}</td>
                        <td className={styles.priceCol}>{formatMoney(item.price)}</td>
                        <td className={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.rowCheckbox}
                            checked={isChecked}
                            disabled={hasCargoSelected}
                            onChange={() => togglePassengerEq(item.id)}
                            aria-label={`Выбрать ${item.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Работы (легковой) */}
          <div className={styles.tableBlock} style={{ marginTop: '10px' }}>
            <h3 className={styles.tableTitle}>Работы (легковой)</h3>
            <div className={styles.tableResponsive}>
              <table className={styles.priceTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>№</th>
                    <th>Работы</th>
                    <th style={{ width: '90px' }} className={styles.centerCol}>Кол-во н/ч</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Стоимость н/ч</th>
                    <th style={{ width: '150px', textAlign: 'right' }} className={styles.totalHeader}>Итого стоимость</th>
                    <th className={styles.checkboxHeader} title="Выбрать для расчета КП">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {worksPassenger.map((work, idx) => {
                    const isChecked = selectedPassengerWorks.includes(work.id);
                    const total = Number(work.hours || 0) * Number(work.rate || 0);
                    return (
                      <tr
                        key={work.id || idx}
                        className={isChecked ? styles.selectedRow : ''}
                        onClick={() => !hasCargoSelected && togglePassengerWork(work.id)}
                        style={{ cursor: hasCargoSelected ? 'not-allowed' : 'pointer' }}
                      >
                        <td className={styles.centerCol}>{idx + 1}</td>
                        <td className={styles.nameCol}>{work.name}</td>
                        <td className={styles.centerCol}>{formatHours(work.hours)}</td>
                        <td className={styles.rateCol}>{formatMoney(work.rate)}</td>
                        <td className={styles.totalCol}>{formatMoney(total)}</td>
                        <td className={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.rowCheckbox}
                            checked={isChecked}
                            disabled={hasCargoSelected}
                            onChange={() => togglePassengerWork(work.id)}
                            aria-label={`Выбрать ${work.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. Блок ГРУЗОВОЙ ТРАНСПОРТ */}
        <div className={`${styles.sectionCard} ${hasPassengerSelected ? styles.sectionDisabled : ''}`} style={{ marginTop: '14px' }}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>🚚</div>
            <div>
              <h2 className={styles.sectionTitle}>Грузовой транспорт</h2>
              <span className={styles.sectionSubtitle}>Оборудование и монтажные работы для грузовых автомобилей</span>
            </div>
            {hasPassengerSelected && (
              <span className={styles.disabledBadge}>
                🔒 Выбран легковой транспорт
              </span>
            )}
          </div>

          {/* Оборудование (грузовой) */}
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>Оборудование (грузовой)</h3>
            <div className={styles.tableResponsive}>
              <table className={styles.priceTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>№</th>
                    <th>Оборудование</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Цена</th>
                    <th className={styles.checkboxHeader} title="Выбрать для расчета КП">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentCargo.map((item, idx) => {
                    const isChecked = selectedCargoEq.includes(item.id);
                    return (
                      <tr
                        key={item.id || idx}
                        className={isChecked ? styles.selectedRow : ''}
                        onClick={() => !hasPassengerSelected && toggleCargoEq(item.id)}
                        style={{ cursor: hasPassengerSelected ? 'not-allowed' : 'pointer' }}
                      >
                        <td className={styles.centerCol}>{idx + 1}</td>
                        <td className={styles.nameCol}>{item.name}</td>
                        <td className={styles.priceCol}>{formatMoney(item.price)}</td>
                        <td className={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.rowCheckbox}
                            checked={isChecked}
                            disabled={hasPassengerSelected}
                            onChange={() => toggleCargoEq(item.id)}
                            aria-label={`Выбрать ${item.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Работы (грузовой) */}
          <div className={styles.tableBlock} style={{ marginTop: '10px' }}>
            <h3 className={styles.tableTitle}>Работы (грузовой)</h3>
            <div className={styles.tableResponsive}>
              <table className={styles.priceTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>№</th>
                    <th>Работы</th>
                    <th style={{ width: '90px' }} className={styles.centerCol}>Кол-во н/ч</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Стоимость н/ч</th>
                    <th style={{ width: '150px', textAlign: 'right' }} className={styles.totalHeader}>Итого стоимость</th>
                    <th className={styles.checkboxHeader} title="Выбрать для расчета КП">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {worksCargo.map((work, idx) => {
                    const isChecked = selectedCargoWorks.includes(work.id);
                    const total = Number(work.hours || 0) * Number(work.rate || 0);
                    return (
                      <tr
                        key={work.id || idx}
                        className={isChecked ? styles.selectedRow : ''}
                        onClick={() => !hasPassengerSelected && toggleCargoWork(work.id)}
                        style={{ cursor: hasPassengerSelected ? 'not-allowed' : 'pointer' }}
                      >
                        <td className={styles.centerCol}>{idx + 1}</td>
                        <td className={styles.nameCol}>{work.name}</td>
                        <td className={styles.centerCol}>{formatHours(work.hours)}</td>
                        <td className={styles.rateCol}>{formatMoney(work.rate)}</td>
                        <td className={styles.totalCol}>{formatMoney(total)}</td>
                        <td className={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.rowCheckbox}
                            checked={isChecked}
                            disabled={hasPassengerSelected}
                            onChange={() => toggleCargoWork(work.id)}
                            aria-label={`Выбрать ${work.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Блок ПРИМЕЧАНИЙ СНИЗУ */}
        {belowNotes.length > 0 && (
          <div className={styles.notesBlock}>
            <div className={styles.notesList}>
              {belowNotes.map((note, idx) => {
                const lines = note.text.split('\n');
                const title = lines.shift();
                return (
                  <div key={note.id || idx} className={styles.noteItem}>
                    {title && <span className={styles.noteItemTitle}>{title}</span>}
                    {lines.map((line, i) => (
                      <span key={i}>{line}<br /></span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Плавающий подвал для быстрого КП */}
      <PpStickyFooter
        visible={isSelectionActive}
        category={selectedItems.category}
        selectedCount={selectedItems.count}
        totalPrice={selectedItems.total}
        onClear={clearAllSelections}
        onGenerateProposal={() => setShowProposal(true)}
      />

      {/* Модальное окно полного коммерческого предложения */}
      <PpProposalModal
        show={showProposal}
        onClose={() => setShowProposal(false)}
        category={selectedItems.category}
        withVat={withVat}
        vatMultiplier={vatMultiplier}
        selectedEquipment={selectedItems.equipment}
        selectedWorks={selectedItems.works}
        priceDate={displayDate}
        totalPrice={selectedItems.total}
      />
    </div>
  );
}
