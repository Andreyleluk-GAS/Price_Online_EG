import { useState, useEffect, useRef } from 'react';
import { 
  getBackupStatus, 
  listBackups, 
  createServerBackup, 
  restoreServerBackup, 
  importBackupData,
  deleteServerBackup
} from '../../api/client';
import styles from './BackupAdminPanel.module.css';

export default function BackupAdminPanel({ onDataUpdated }) {
  const [status, setStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadInfo();
  }, []);

  async function loadInfo() {
    try {
      setLoading(true);
      setError(null);
      const [statusRes, listRes] = await Promise.all([
        getBackupStatus().catch(() => null),
        listBackups().catch(() => [])
      ]);
      setStatus(statusRes);
      setBackups(Array.isArray(listRes) ? listRes : []);
    } catch (err) {
      setError('Не удалось загрузить данные бэкапов: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBackup() {
    try {
      setActionLoading(true);
      setMessage(null);
      setError(null);
      const res = await createServerBackup('manual');
      if (res.success) {
        setMessage(`Точка восстановления успешно создана: ${res.backup?.filename}`);
        await loadInfo();
      }
    } catch (err) {
      setError('Ошибка создания бэкапа: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestoreServerBackup(filename) {
    if (!window.confirm(`Вы уверены, что хотите восстановить данные из снимка "${filename}"? Текущие данные будут заменены, но перед этим сервер создаст защитную копию.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      setError(null);
      const res = await restoreServerBackup(filename);
      if (res.success) {
        setMessage(`Данные успешно восстановлены из "${filename}"!`);
        await loadInfo();
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      setError('Ошибка восстановления: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteBackup(filename) {
    if (!window.confirm(`Вы действительно хотите удалить файл бэкапа "${filename}"?\nЭто действие нельзя отменить.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      setError(null);
      const res = await deleteServerBackup(filename);
      if (res.success) {
        setMessage(`Файл бэкапа "${filename}" успешно удален`);
        await loadInfo();
      }
    } catch (err) {
      setError('Ошибка удаления бэкапа: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleDownloadExport() {
    window.open('/api/backup/export', '_blank');
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Восстановить данные из файла "${file.name}"? Это заменит цены, каталог авто, настройки и данные ПП.`)) {
      e.target.value = '';
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      setError(null);

      const text = await file.text();
      const json = JSON.parse(text);

      const res = await importBackupData(json);
      if (res.success) {
        setMessage('Данные успешно импортированы и применены!');
        await loadInfo();
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      setError('Ошибка импорта файла бэкапа: ' + err.message);
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  }

  return (
    <div className={styles.container}>
      {message && <div className={styles.alertSuccess}>✅ {message}</div>}
      {error && <div className={styles.alertError}>⚠️ {error}</div>}

      {/* 1. Блок состояния данных */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>📊 Состояние актуальных данных на бэкенде</h3>
          <button 
            type="button" 
            className={styles.btnSecondary} 
            onClick={loadInfo} 
            disabled={loading || actionLoading}
          >
            {loading ? 'Обновление...' : '🔄 Обновить статус'}
          </button>
        </div>

        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>⛽</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>Цены на топливо и Общий прайс</div>
              <div className={styles.statusValue}>
                {status?.settings?.fuelUpdatedAt 
                  ? new Date(status.settings.fuelUpdatedAt).toLocaleString('ru-RU')
                  : 'Не задано'}
              </div>
              <div className={styles.statusSub}>
                {status?.settings?.generalPriceEnabled ? '🟢 Общий прайс включен' : '⚪ Общий прайс выключен'}
              </div>
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>📋</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>Прайс-лист ГБО (PRICEDATA)</div>
              <div className={styles.statusValue}>
                {status?.pricedata?.updatedAt 
                  ? new Date(status.pricedata.updatedAt).toLocaleString('ru-RU')
                  : 'Файл не загружен'}
              </div>
              <div className={styles.statusSub}>
                Категорий в базе: {status?.pricedata?.categoriesCount || 0}
              </div>
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>🚗</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>База автомобилей (CARLIST)</div>
              <div className={styles.statusValue}>
                {status?.carsdata?.count ? `${status.carsdata.count} моделей` : '0 моделей'}
              </div>
              <div className={styles.statusSub}>
                {status?.carsdata?.exists ? '🟢 База активна' : '⚪ База пуста'}
              </div>
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>❄️</div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>Прайс ПП (Подогреватели)</div>
              <div className={styles.statusValue}>
                {status?.pp_data?.priceDate ? `Прайс от ${status.pp_data.priceDate}` : 'Не задан'}
              </div>
              <div className={styles.statusSub}>
                {status?.pp_data?.updatedAt ? new Date(status.pp_data.updatedAt).toLocaleString('ru-RU') : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Блок экспорта и импорта (синхронизация) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🔄 Синхронизация данных (Экспорт / Импорт)</h3>
        </div>
        <p className={styles.cardDesc}>
          Вы можете выгрузить все текущие настройки, машины и прайсы в единый файл для переноса между сервером и локальной средой разработки, либо восстановить данные из ранее выгруженного файла.
        </p>

        <div className={styles.actionButtons}>
          <button 
            type="button" 
            className={styles.btnPrimary}
            onClick={handleDownloadExport}
            disabled={actionLoading}
          >
            📥 Скачать полный файл бэкапа (.json)
          </button>

          <button 
            type="button" 
            className={styles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            disabled={actionLoading}
          >
            📤 Восстановить из файла бэкапа
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <button 
            type="button" 
            className={styles.btnOutline}
            onClick={handleCreateBackup}
            disabled={actionLoading}
          >
            💾 Создать точку восстановления на сервере
          </button>
        </div>
      </div>

      {/* 3. Список резервных копий на сервере */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🗄️ Точки восстановления на сервере</h3>
          <span className={styles.badge}>{backups.length} копий</span>
        </div>

        {backups.length === 0 ? (
          <div className={styles.emptyState}>На сервере пока нет сохраненных резервных копий.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '42%' }}>Тип и файл копии</th>
                  <th style={{ width: '25%' }}>Дата создания</th>
                  <th style={{ width: '13%' }}>Размер</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.typeBadgeRow}>
                          <span className={`${styles.typeBadge} ${styles['badge_' + (b.typeBadge || 'auto')]}`}>
                            {b.typeIcon || '💾'} {b.typeTitle || 'Снимок данных'}
                          </span>
                        </div>
                        <div className={styles.filenameMono} title={b.filename}>
                          {b.filename}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {new Date(b.updatedAt).toLocaleString('ru-RU')}
                      </span>
                    </td>
                    <td>
                      <span className={styles.sizeText}>
                        {(b.sizeBytes / 1024).toFixed(1)} КБ
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.rowActions}>
                        <button 
                          type="button"
                          className={styles.btnRestore}
                          onClick={() => handleRestoreServerBackup(b.filename)}
                          disabled={actionLoading}
                          title="Применить данные из этого снимка"
                        >
                          Применить
                        </button>
                        <button 
                          type="button"
                          className={styles.btnDelete}
                          onClick={() => handleDeleteBackup(b.filename)}
                          disabled={actionLoading}
                          title="Удалить файл бэкапа"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
