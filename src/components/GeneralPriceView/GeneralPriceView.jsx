import React from 'react';
import styles from './GeneralPriceView.module.css';

export default function GeneralPriceView({ data, settings }) {
  // Use today's date or the date the settings were updated
  const dateStr = settings?.fuel_prices_updated_at 
    ? new Date(settings.fuel_prices_updated_at).toLocaleDateString('ru-RU')
    : new Date().toLocaleDateString('ru-RU');

  // If no data provided, display an empty state
  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.tableWrapper}>
          <p className={styles.emptyText}>Общий прайс-лист пока не заполнен.</p>
        </div>
      </div>
    );
  }

  // Filter enabled notes
  const activeNotes = Array.isArray(settings?.generalPriceNotes) 
    ? settings.generalPriceNotes.filter(n => n.isEnabled && n.text.trim() !== '') 
    : [];
  
  const aboveNotes = activeNotes.filter(n => n.position === 'above');
  const belowNotes = activeNotes.filter(n => n.position === 'below');

  // Group data by vehicle_type to calculate rowSpans
  let currentGroupIndex = 0;
  let currentVehicleType = null;
  let spanCount = 0;

  const groupedData = data.map((row, index) => {
    if (row.vehicle_type !== currentVehicleType || spanCount === 0) {
      currentVehicleType = row.vehicle_type;
      spanCount = 1;
      // Look ahead to count identical consecutive vehicle_types
      for (let i = index + 1; i < data.length; i++) {
        if (data[i].vehicle_type === currentVehicleType) spanCount++;
        else break;
      }
      const gIndex = currentGroupIndex % 6;
      currentGroupIndex++;
      return { ...row, groupIndex: gIndex, rowSpan: spanCount, isFirstInGroup: true };
    } else {
      spanCount--;
      return { ...row, groupIndex: (currentGroupIndex - 1) % 6, rowSpan: 0, isFirstInGroup: false };
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        
        {aboveNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {aboveNotes.map(note => {
              const lines = note.text.split('\n');
              const title = lines.shift();
              return (
                <div key={note.id} className={styles.topNote}>
                  {title && <span className={styles.topNoteTitle}>{title}</span>}
                  {lines.map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.dateBadgeWrapper}>
          <div className={styles.dateBadge}>
            <span className={styles.dateLabel}>ЦЕНЫ ДЕЙСТВИТЕЛЬНЫ С:</span>
            <span className={styles.dateValue}>{dateStr}</span>
          </div>
        </div>

        <table className={styles.priceTable}>
          <thead>
            <tr>
              <th>ДВС<span>(цил.)</span></th>
              <th>БАЛЛОН<span>(л.)</span></th>
              <th className={styles.hideOnMobile}>СОСТАВ КОМПЛЕКТА<span style={{ visibility: 'hidden' }}>.</span></th>
              <th className={styles.hideOnMobile}>КОМПЛЕКТ<span>(руб.)</span></th>
              <th className={styles.hideOnMobile}>УСТАНОВКА<span>(руб.)</span></th>
              <th className={styles.totalCol}>ИТОГО<span>(руб.)</span></th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((row, idx) => {
              const total = (Number(row.price_kit) || 0) + (Number(row.price_install) || 0);
              return (
                <tr key={idx} className={styles[`group${row.groupIndex}`]}>
                  {row.isFirstInGroup && (
                    <td rowSpan={row.rowSpan} className={styles.colVehicleWrapper}>
                      <div className={styles.colVehicle}>{row.vehicle_type}</div>
                    </td>
                  )}
                  <td className={styles.colRegular}>{row.tank_type}</td>
                  <td className={`${styles.hideOnMobile} ${styles.colLeft} ${styles.colRegular}`}>{row.composition}</td>
                  <td className={styles.hideOnMobile}>{Number(row.price_kit).toLocaleString('ru-RU')}</td>
                  <td className={styles.hideOnMobile}>{Number(row.price_install).toLocaleString('ru-RU')}</td>
                  <td className={styles.totalCol}>{total.toLocaleString('ru-RU')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {belowNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {belowNotes.map(note => {
              const lines = note.text.split('\n');
              const title = lines.shift();
              return (
                <div key={note.id} className={styles.bottomNote}>
                  {title && <span className={styles.bottomNoteTitle}>{title}</span>}
                  {lines.map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
