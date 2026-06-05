import logo from '../../assets/logo_price.jpg';
import { formatDate } from '../../utils/formatters';
import styles from './Header.module.css';

export default function Header({ settings, showAdmin, onToggleAdmin }) {
  return (
    <header className={styles.header}>
      {/* Контейнер шапки с Flexbox для выравнивания */}
      <div className={styles.inner}>
        
        {/* Логотип по левому краю */}
        <div className={styles.logoWrapper}>
          <img 
            src={logo} 
            alt="Логотип калькулятора" 
            className="h-8 sm:h-10 w-auto object-contain max-w-[200px] sm:max-w-none"
            style={{ height: '40px', width: 'auto', objectFit: 'contain', maxWidth: '200px' }}
          />
        </div>
        <button
          className={`${styles.adminBtn} ${showAdmin ? styles.adminBtnActive : ''}`}
          onClick={onToggleAdmin}
          title={showAdmin ? 'К калькулятору' : 'Панель администратора'}
        >
          {showAdmin ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12,19 5,12 12,5"/>
              </svg>
              Калькулятор
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              Админ
            </>
          )}
        </button>
      </div>
    </header>
  );
}
