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

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        
        {aboveNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {aboveNotes.map(note => (
              <div key={note.id} className={styles.infoHeader}>
                {note.text.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
            ))}
          </div>
        )}

        <table className={styles.priceTable}>
          <thead>
            <tr>
              <th>Тип ТС</th>
              <th>Тип баллона</th>
              <th className={styles.hideOnMobile}>Состав</th>
              <th className={`${styles.hideOnMobile} ${styles.priceCol}`}>Стоимость комплект</th>
              <th className={`${styles.hideOnMobile} ${styles.priceCol}`}>Стоимость установка</th>
              <th className={styles.priceCol}>ИТОГО <span className={styles.dateHeader}>на {dateStr}</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const total = (Number(row.price_kit) || 0) + (Number(row.price_install) || 0);
              return (
                <tr key={idx}>
                  <td>{row.vehicle_type}</td>
                  <td>{row.tank_type}</td>
                  <td className={styles.hideOnMobile}>{row.composition}</td>
                  <td className={`${styles.hideOnMobile} ${styles.priceCol}`}>{Number(row.price_kit).toLocaleString('ru-RU')}</td>
                  <td className={`${styles.hideOnMobile} ${styles.priceCol}`}>{Number(row.price_install).toLocaleString('ru-RU')}</td>
                  <td className={`${styles.totalCell} ${styles.priceCol}`}>{total.toLocaleString('ru-RU')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {belowNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {belowNotes.map(note => (
              <div key={note.id} className={styles.footerNote} style={{ marginTop: 0 }}>
                {note.text.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
