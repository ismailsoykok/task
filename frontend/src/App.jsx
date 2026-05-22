import { useState, useEffect } from 'react';
import { useNotifications } from './hooks/useNotifications';
import { TransferCard } from './components/TransferCard';
import './App.css';

function App() {
  const { notifications, rawHistory, token, permission, error } = useNotifications();
  const [showDevInfo, setShowDevInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState('0'); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSeenRawCount, setLastSeenRawCount] = useState(0);

  // 1. sayfada değilsek akış duruyor zıplamasın diye
  useEffect(() => {
    if (currentPage === 1) {
      setDisplayedNotifications(notifications);
      setPendingCount(0);
      setLastSeenRawCount(rawHistory.length);
    } else {
      setPendingCount(Math.max(0, rawHistory.length - lastSeenRawCount));
    }
  }, [notifications, rawHistory.length, currentPage, lastSeenRawCount]);

  const handleApplyPending = () => {
    setDisplayedNotifications(notifications);
    setPendingCount(0);
    setLastSeenRawCount(rawHistory.length);
    setCurrentPage(1);
  };
 
  
  const liveCount = rawHistory.length;
  const liveVolume = rawHistory.reduce((sum, tx) => {
    if (!tx || !tx.amount) return sum;
    const parsedAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount);
    return sum + (isNaN(parsedAmount) ? 0 : parsedAmount);
  }, 0);
  const liveAvg = liveCount > 0 ? (liveVolume / liveCount) : 0;

  const baseVolume = 0; 
  const baseOutflow = 0; 
  const baseTransactions = 0;
  const baseSenders = 0;
  const baseReceivers = 0;

  // burda da canlı hacmi falan topluyoruz sıfırdan
  const computedVolume = baseVolume + liveVolume;
  const computedOutflow = baseOutflow + (liveVolume * 0.45); 
  const computedAvg = liveCount > 0 ? liveAvg : 0; 
  const totalTransactionsCount = baseTransactions + liveCount;
  
  const uniqueSendersSet = new Set(rawHistory.map(tx => tx.sender).filter(Boolean));
  const totalSendersCount = baseSenders + uniqueSendersSet.size;

  const uniqueReceiversSet = new Set(rawHistory.map(tx => tx.receiver).filter(Boolean));
  const totalReceiversCount = baseReceivers + uniqueReceiversSet.size;

  const totalUniqueAddresses = new Set([
    ...rawHistory.map(tx => tx.sender),
    ...rawHistory.map(tx => tx.receiver)
  ].filter(Boolean)).size;

  let mediumWhalesCount = 0;
  let largeWhalesCount = 0;
  let megaWhalesCount = 0;
  let maxTransferAmount = 0;

  rawHistory.forEach(tx => {
    if (!tx || !tx.amount) return;
    const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount);
    if (isNaN(amount)) return;
    
    if (amount > maxTransferAmount) {
      maxTransferAmount = amount;
    }
    
    if (amount >= 1000000) {
      megaWhalesCount++;
    } else if (amount >= 500000) {
      largeWhalesCount++;
    } else if (amount >= 100000) {
      mediumWhalesCount++;
    }
  });

  const totalWhalesCount = mediumWhalesCount + largeWhalesCount + megaWhalesCount;
  
  const mediumWhalesPercent = totalWhalesCount > 0 ? Math.round((mediumWhalesCount / totalWhalesCount) * 100) : 0;
  const largeWhalesPercent = totalWhalesCount > 0 ? Math.round((largeWhalesCount / totalWhalesCount) * 100) : 0;
  const megaWhalesPercent = totalWhalesCount > 0 ? Math.round((megaWhalesCount / totalWhalesCount) * 100) : 0;

  const formatUSDT = (val) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(val) + ' USDT';
  };

  // arama falan yapınca filtreleyen yer burası
  const filteredNotifications = displayedNotifications
    .filter(tx => {
      const matchesSearch = searchQuery 
        ? (tx.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           tx.receiver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           tx.txHash?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      const parsedAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || '0');
      const matchesAmount = parsedAmount >= parseFloat(minAmountFilter);
      
      return matchesSearch && matchesAmount;
    })
    .sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : parseFloat(a.timestamp || '0');
      const tB = typeof b.timestamp === 'number' ? b.timestamp : parseFloat(b.timestamp || '0');
      const cleanA = isNaN(tA) ? 0 : tA;
      const cleanB = isNaN(tB) ? 0 : tB;
      return cleanB - cleanA;
    });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  let currentVelocityRatio = 1.0;
  if (rawHistory.length >= 2) {
    const latest = typeof rawHistory[0].amount === 'number' ? rawHistory[0].amount : parseFloat(rawHistory[0].amount || '0');
    const prev = typeof rawHistory[1].amount === 'number' ? rawHistory[1].amount : parseFloat(rawHistory[1].amount || '0');
    if (prev > 0) {
      currentVelocityRatio = latest / prev;
    }
  }

  // ivme grafiğinin koordinatları burda hesaplanıyo
  const getVelocityPath = () => {
    const recent = [...rawHistory].slice(0, 7).reverse();
    const points = [];
    
    if (recent.length >= 2) {
      for (let i = 1; i < recent.length; i++) {
        const current = typeof recent[i].amount === 'number' ? recent[i].amount : parseFloat(recent[i].amount || '0');
        const prev = typeof recent[i-1].amount === 'number' ? recent[i-1].amount : parseFloat(recent[i-1].amount || '0');
        if (prev > 0) {
          points.push(current / prev);
        } else {
          points.push(1.0);
        }
      }
    }

    while (points.length < 6) {
      points.unshift(1.0);
    }

    const width = 140;
    const height = 35;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal;

    const coords = points.map((val, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = range > 0 
        ? height - 4 - ((val - minVal) / range) * (height - 8)
        : height / 2;
      return { x, y };
    });

    const pathData = coords.length > 0
      ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
      : '';
    
    const areaData = coords.length > 0
      ? `${pathData} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`
      : '';

    const lastPoint = coords.length > 0 ? coords[coords.length - 1] : null;

    return { pathData, areaData, lastPoint };
  };

  const velocityPath = getVelocityPath();

  return (
    <div className="dashboard-container">

      <main className="main-content">
      
        <header className="main-header">
          <div className="header-title">
            <h1>Dashboard</h1>
            <p>100.000 USDT İşlem Alarmları ve Canlı Transfer Akışı</p>
          </div>
          
          <div className="header-controls">
            <div className="search-box">
              <svg viewBox="0 0 24 24" className="search-icon"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input 
                type="text" 
                placeholder="Adres veya işlem hash'i ara..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="filter-box">
              <svg viewBox="0 0 24 24" className="filter-icon"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
              <select 
                value={minAmountFilter}
                onChange={(e) => {
                  setMinAmountFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="0">Tüm Miktarlar</option>
                <option value="100000">&gt; 100B USDT</option>
                <option value="500000">&gt; 500B USDT</option>
                <option value="1000000">&gt; 1M USDT</option>
              </select>
            </div>

            <div className={`status-pill ${permission}`}>
              <span className="status-dot"></span>
              <span>FCM: {permission === 'granted' ? 'Aktif' : permission === 'denied' ? 'Engellendi' : 'Bekliyor'}</span>
            </div>
          </div>
        </header>

        
        <div className="dashboard-grid">
         
          <div className="grid-left-col">
        
            <div className="stats-cards-container">
              <div className="stats-card total-volume-card">
                <div className="volume-card-left">
                  <div className="stats-card-header">
                    <span className="stats-label">Takip Edilen Toplam Hacim</span>
                  </div>
                  <div className="stats-value-row">
                    <h3 className="stats-number">{formatCurrency(computedVolume)}</h3>
                  </div>
                  <p className="stats-subtext">Blockchain'den canlı toplanan USDT transfer hacmi</p>
                </div>

                <div className="volume-card-right">
                  <div className="velocity-header">
                    <span className="velocity-label">Hacim İvmesi</span>
                    <span className={`velocity-value-badge ${currentVelocityRatio >= 1 ? 'accelerating' : 'decelerating'}`}>
                      x{currentVelocityRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="velocity-chart-container">
                    <svg className="velocity-sparkline-svg" viewBox="0 0 140 35">
                      <defs>
                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {velocityPath.areaData && (
                        <path fill="url(#velocityGradient)" d={velocityPath.areaData} />
                      )}
                      {velocityPath.pathData && (
                        <path fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" d={velocityPath.pathData} />
                      )}
                      {velocityPath.lastPoint && (
                        <circle cx={velocityPath.lastPoint.x} cy={velocityPath.lastPoint.y} r="2.5" fill="var(--accent-teal)" />
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          
            {error && (
              <div className="warning-banner fade-in">
                <div className="warning-banner-title">
                  <svg viewBox="0 0 24 24" className="warning-icon"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <strong>Yapılandırma Uyarısı</strong>
                </div>
                <p>{error}</p>
              </div>
            )}

            
            <div className="alerts-stream-container">
              <div className="alerts-stream-header">
                <h3>Canlı Bildirim Akışı ({filteredNotifications.length})</h3>
                <span className="pulse-indicator">
                  <span className="pulse-dot"></span>
                  Canlı dinleniyor
                </span>
              </div>

              {pendingCount > 0 && (
                <div className="pending-updates-banner" onClick={handleApplyPending}>
                  <span className="pending-updates-pulse"></span>
                  <span>{pendingCount} yeni transfer tespit edildi. Akışı güncellemek için tıklayın.</span>
                </div>
              )}

              {filteredNotifications.length === 0 ? (
                <div className="empty-state-panel">
                  <div className="pulse-ring-loader"></div>
                  <h4>Uyumlu işlem bulunamadı</h4>
                  <p>Blockchain ağından gelecek büyük USDT transferleri bekleniyor...</p>
                  <span className="info-helper">
                    100.000 USDT üzerindeki transferler otomatik olarak akışa yansır.
                  </span>
                </div>
              ) : (
                <>
                  <div className="alerts-list">
                    {paginatedNotifications.map((tx, idx) => (
                      <TransferCard key={tx.id || tx.txHash || idx} transfer={tx} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="dashboard-pagination">
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="pagination-arrow-btn"
                      >
                        ← Önceki
                      </button>
                      <span className="pagination-text">
                        Sayfa {currentPage} / {totalPages}
                      </span>
                      <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="pagination-arrow-btn"
                      >
                        Sonraki →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

      
          <div className="grid-right-col">
            <div className="overview-card">
              <div className="overview-header">
                <h3>Genel Bakış</h3>
                <div className="overview-dots">•••</div>
              </div>

              <div className="overview-list">
                <div className="overview-item">
                  <div className="overview-color-dot" style={{ backgroundColor: 'var(--accent-teal)' }}></div>
                  <div className="overview-details">
                    <span className="overview-number">{totalTransactionsCount}</span>
                    <span className="overview-label">Toplam İşlem Adedi</span>
                  </div>
                </div>
                
                <div className="overview-item">
                  <div className="overview-color-dot" style={{ backgroundColor: 'var(--accent-blue-real)' }}></div>
                  <div className="overview-details">
                    <span className="overview-number">
                      {computedVolume === 0 ? '0 USDT' : formatUSDT(computedVolume)}
                    </span>
                    <span className="overview-label">Toplam Hacim</span>
                  </div>
                </div>

                <div className="overview-item">
                  <div className="overview-color-dot" style={{ backgroundColor: 'var(--accent-purple-violet)' }}></div>
                  <div className="overview-details">
                    <span className="overview-number">
                      {maxTransferAmount === 0 ? '0 USDT' : formatUSDT(maxTransferAmount)}
                    </span>
                    <span className="overview-label">En Büyük Transfer</span>
                  </div>
                </div>

                <div className="overview-item">
                  <div className="overview-color-dot" style={{ backgroundColor: 'var(--accent-orange)' }}></div>
                  <div className="overview-details">
                    <span className="overview-number">
                      {computedAvg === 0 ? '0 USDT' : formatUSDT(computedAvg)}
                    </span>
                    <span className="overview-label">Ortalama İşlem Boyutu</span>
                  </div>
                </div>

                <div className="overview-item">
                  <div className="overview-color-dot" style={{ backgroundColor: 'var(--accent-pink-red)' }}></div>
                  <div className="overview-details">
                    <span className="overview-number">{totalUniqueAddresses}</span>
                    <span className="overview-label">Aktif Benzersiz Adres</span>
                  </div>
                </div>

                <div className="overview-item">
                  <div className="overview-color-dot" style={{ backgroundColor: 'var(--text-muted)' }}></div>
                  <div className="overview-details">
                    <span className="overview-number">{totalWhalesCount}</span>
                    <span className="overview-label">Toplam Balina Transferi</span>
                  </div>
                </div>
              </div>

              <div className="overview-chart-container">
                <span className="chart-label">Hacim Dağılımı</span>
                <div className="distribution-container">
                  <div className="distribution-row">
                    <div className="distribution-header">
                      <span className="distribution-label">Orta (100B - 500B USDT)</span>
                      <span className="distribution-value">{mediumWhalesCount} adet (%{mediumWhalesPercent})</span>
                    </div>
                    <div className="distribution-bar-bg">
                      <div className="distribution-bar-fill" style={{ width: `${mediumWhalesPercent}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="distribution-row">
                    <div className="distribution-header">
                      <span className="distribution-label">Büyük (500B - 1M USDT)</span>
                      <span className="distribution-value">{largeWhalesCount} adet (%{largeWhalesPercent})</span>
                    </div>
                    <div className="distribution-bar-bg">
                      <div className="distribution-bar-fill" style={{ width: `${largeWhalesPercent}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="distribution-row">
                    <div className="distribution-header">
                      <span className="distribution-label">Mega (1M+ USDT)</span>
                      <span className="distribution-value">{megaWhalesCount} adet (%{megaWhalesPercent})</span>
                    </div>
                    <div className="distribution-bar-bg">
                      <div className="distribution-bar-fill" style={{ width: `${megaWhalesPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {token && (
                <div className="overview-fcm-section">
                  <button 
                    className="overview-fcm-btn"
                    onClick={() => setShowDevInfo(!showDevInfo)}
                  >
                    <svg viewBox="0 0 24 24" className="fcm-btn-icon">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
                    </svg>
                    {showDevInfo ? 'FCM Bildirim Detaylarını Gizle' : 'FCM Tokenını Göster / Kopyala'}
                  </button>
                  
                  {showDevInfo && (
                    <div className="fcm-token-details-inline fade-in">
                      <p className="token-full-label">Cihaz FCM Tokenı (Bildirim Aboneliği):</p>
                      <textarea 
                        className="token-textarea-inline" 
                        readOnly 
                        value={token}
                        onClick={(e) => e.target.select()}
                      />
                      <button 
                        className="fcm-copy-btn-inline"
                        onClick={() => {
                          navigator.clipboard.writeText(token);
                          alert('FCM Tokenı panoya kopyalandı!');
                        }}
                      >
                        Token Adresini Kopyala
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
