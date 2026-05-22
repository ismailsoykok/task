import React from 'react';
import './TransferCard.css';

export function TransferCard({ transfer }) {
  const { sender, receiver, amount, txHash } = transfer;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return 'Unknown';
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0');

  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(parsedAmount);

  // gelen timestamp'i burda formatlıyoruz
  const formattedTime = React.useMemo(() => {
    if (!transfer.timestamp) return '';
    const date = new Date(transfer.timestamp);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  }, [transfer.timestamp]);

  // etherscan linkini buraya veriyoruz
  const txLink = `https://etherscan.io/tx/${txHash}`;

  return (
    <div className="transfer-card animate-slide-up">
      <div className="transfer-card-inner">
        <div className="transfer-card-header">
          <div className="token-info">
            <div className="token-icon">₮</div>
            <div className="token-name-group">
              <span className="token-symbol">USDT</span>
              <span className="token-desc">
                Balina Transferi {formattedTime && <span className="transfer-time-label">• {formattedTime}</span>}
              </span>
            </div>
          </div>
          <div className="amount-display">
            <span className="amount-value">{formattedAmount}</span>
            <span className="amount-currency">USDT</span>
          </div>
        </div>

        <div className="transfer-card-body">
          <div className="address-card">
            <span className="address-label">Gönderici</span>
            <span className="address-hash" title={sender}>{sender}</span>
          </div>

          <div className="transfer-arrow-container">
            <div className="transfer-arrow-pulse">
              <svg viewBox="0 0 24 24" className="arrow-svg">
                <path fill="currentColor" d="M16.01 11H4v2h12.01v3L20 12l-3.99-4v3z"/>
              </svg>
            </div>
          </div>

          <div className="address-card">
            <span className="address-label">Alıcı</span>
            <span className="address-hash" title={receiver}>{receiver}</span>
          </div>
        </div>

        <div className="transfer-card-footer">
          <div className="tx-hash-badge" title={txHash}>
            <span className="tx-hash-label">TX HASH:</span>
            <div className="tx-hash-value-container" onClick={handleCopy}>
              <span className="tx-hash-value">{txHash}</span>
              <button className="tx-copy-btn" aria-label="Hash kopyala">
                {copied ? (
                  <svg viewBox="0 0 24 24" className="copy-icon success"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="copy-icon"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                )}
              </button>
              {copied && <span className="copied-tooltip">Kopyalandı!</span>}
            </div>
          </div>
          <a 
            href={txLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="etherscan-button"
          >
            <span>Etherscan'de Görüntüle</span>
            <svg viewBox="0 0 24 24" className="external-link-icon">
              <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
