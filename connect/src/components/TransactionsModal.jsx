import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  PhoneCall,
  Gift,
  Zap,
  Calendar,
  Crown,
  Sparkles,
  Wallet,
  Clock,
} from 'lucide-react';
import { fetchUserLedger } from '../firebase/rewardService';
import { useLanguage } from '../context/LanguageContext';

const getLocalLedger = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`connect_local_ledger_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export default function TransactionsModal({ uid, coins = 0, onClose }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (uid) {
      setIsLoading(true);
      fetchUserLedger(uid)
        .then((serverTxns) => {
          if (!isMounted) return;
          const localTxns = getLocalLedger(uid);
          // Merge server transactions with local transactions, deduplicating by transaction ID
          const seen = new Set();
          const merged = [];
          for (const txn of serverTxns || []) {
            if (txn.id && !seen.has(txn.id)) {
              seen.add(txn.id);
              merged.push(txn);
            }
          }
          for (const txn of localTxns) {
            if (txn.id && !seen.has(txn.id)) {
              seen.add(txn.id);
              merged.push(txn);
            }
          }
          // Sort latest first
          merged.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
          setTransactions(merged);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load user ledger from server, falling back to local store:', err);
          if (isMounted) {
            setTransactions(getLocalLedger(uid));
            setIsLoading(false);
          }
        });
    } else {
      setTransactions([]);
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [uid]);

  // Compute total credits and debits for full coin accounting
  const totalCredits = transactions
    .filter((t) => t.isCredit)
    .reduce((sum, t) => sum + (Number(t.coins) || 0), 0);

  const totalDebits = transactions
    .filter((t) => !t.isCredit)
    .reduce((sum, t) => sum + (Number(t.coins) || 0), 0);

  const filtered = transactions.filter((txn) => {
    if (filter === 'credit') return txn.isCredit;
    if (filter === 'debit') return !txn.isCredit;
    return true;
  });

  const getTxnMeta = (txn) => {
    const type = String(txn.type || '').toLowerCase();
    const isCredit = Boolean(txn.isCredit);

    if (type === 'call') {
      return {
        icon: <PhoneCall size={15} />,
        label: t('txn_call_label', 'Video Call'),
        badgeColor: '#ff2a8d',
        badgeBg: 'rgba(255, 42, 141, 0.16)',
        borderColor: 'rgba(255, 42, 141, 0.35)',
      };
    }
    if (type === 'gift') {
      return {
        icon: <Gift size={15} />,
        label: t('txn_gift_label', 'Gift Sent'),
        badgeColor: '#c084fc',
        badgeBg: 'rgba(192, 132, 252, 0.16)',
        borderColor: 'rgba(192, 132, 252, 0.35)',
      };
    }
    if (type === 'purchase') {
      return {
        icon: <Zap size={15} />,
        label: t('txn_recharge_label', 'Coin Recharge'),
        badgeColor: '#4ade80',
        badgeBg: 'rgba(74, 222, 128, 0.16)',
        borderColor: 'rgba(74, 222, 128, 0.35)',
      };
    }
    if (type === 'daily_reward') {
      return {
        icon: <Calendar size={15} />,
        label: t('txn_daily_label', 'Daily Reward'),
        badgeColor: '#22d3ee',
        badgeBg: 'rgba(34, 211, 238, 0.16)',
        borderColor: 'rgba(34, 211, 238, 0.35)',
      };
    }
    if (type === 'vip_bonus' || type === 'vip_purchase') {
      return {
        icon: <Crown size={15} />,
        label: t('txn_vip_label', 'VIP Benefit'),
        badgeColor: '#fbbf24',
        badgeBg: 'rgba(251, 191, 36, 0.16)',
        borderColor: 'rgba(251, 191, 36, 0.35)',
      };
    }
    if (type === 'promo_code') {
      return {
        icon: <Sparkles size={15} />,
        label: t('txn_promo_label', 'Promo Code (YASH)'),
        badgeColor: '#f472b6',
        badgeBg: 'rgba(244, 114, 182, 0.16)',
        borderColor: 'rgba(244, 114, 182, 0.35)',
      };
    }

    return {
      icon: isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />,
      label: isCredit ? t('txn_added_label', 'Coins Added') : t('txn_spent_label', 'Coins Spent'),
      badgeColor: isCredit ? '#4ade80' : '#f87171',
      badgeBg: isCredit ? 'rgba(74, 222, 128, 0.16)' : 'rgba(248, 113, 113, 0.16)',
      borderColor: isCredit ? 'rgba(74, 222, 128, 0.35)' : 'rgba(248, 113, 113, 0.35)',
    };
  };

  return (
    <div className="transactions-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="transactions-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="transactions-modal-header">
          <button className="txn-back-btn" onClick={onClose} aria-label="Back">
            <ArrowLeft size={19} color="#fff" />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 className="txn-modal-title">Transaction History</h2>
            <div style={{ fontSize: 11, color: '#c9b4d5', opacity: 0.85 }}>
              Passbook & Complete Coin Accounting
            </div>
          </div>
          <div style={{ width: 32 }} />
        </div>

        {/* ── Coin Passbook Balance & Statistics Header ── */}
        <div className="txn-summary-banner">
          <div className="txn-summary-item balance">
            <span className="txn-summary-lbl">Current Balance</span>
            <span className="txn-summary-val balance-val">
              🪙 {Number(coins).toLocaleString()} <small>Coins</small>
            </span>
          </div>
          <div className="txn-summary-divider" />
          <div className="txn-summary-item credit">
            <span className="txn-summary-lbl">Total Received</span>
            <span className="txn-summary-val credit-val">+{totalCredits.toLocaleString()}</span>
          </div>
          <div className="txn-summary-divider" />
          <div className="txn-summary-item debit">
            <span className="txn-summary-lbl">Total Spent</span>
            <span className="txn-summary-val debit-val">-{totalDebits.toLocaleString()}</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="txn-filter-row">
          <button
            className={`txn-filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button
            className={`txn-filter-chip ${filter === 'credit' ? 'active' : ''}`}
            onClick={() => setFilter('credit')}
          >
            🪙 Received (+{totalCredits})
          </button>
          <button
            className={`txn-filter-chip ${filter === 'debit' ? 'active' : ''}`}
            onClick={() => setFilter('debit')}
          >
            📉 Spent (-{totalDebits})
          </button>
        </div>

        {/* Transactions List */}
        <div className="txn-list">
          {isLoading ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#c9b4d5' }}>
              <Clock size={24} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
              <div>Loading transaction passbook...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '44px 16px', textAlign: 'center', color: '#c9b4d5' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>📜</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f3e8ff', marginBottom: 4 }}>
                {filter === 'credit'
                  ? 'No coins received yet.'
                  : filter === 'debit'
                  ? 'No coins spent yet.'
                  : 'No transactions yet.'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 260, margin: '0 auto' }}>
                Recharge wallet, make video calls, or claim daily rewards to see each coin accounted for here.
              </div>
            </div>
          ) : (
            filtered.map((txn) => {
              const meta = getTxnMeta(txn);
              return (
                <div key={txn.id || Math.random()} className="txn-card">
                  <div className="txn-card-left">
                    <div
                      className="txn-icon-wrap"
                      style={{
                        background: meta.badgeBg,
                        borderColor: meta.borderColor,
                        color: meta.badgeColor,
                      }}
                    >
                      {meta.icon}
                    </div>

                    <div className="txn-details">
                      <div className="txn-category-row">
                        <span
                          className="txn-category-badge"
                          style={{
                            color: meta.badgeColor,
                            borderColor: meta.borderColor,
                            background: meta.badgeBg,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span className="txn-date">{txn.date}</span>
                      </div>

                      <div className="txn-title" title={txn.title}>
                        {txn.title}
                      </div>

                      {/* 1 1 Coin Ka Hisab: Running Balance after this transaction */}
                      {txn.balanceAfter !== undefined && txn.balanceAfter !== null && (
                        <div className="txn-balance-after-pill">
                          <span className="coin-icon">🪙</span>
                          <span>
                            Wallet Balance: <strong>{Number(txn.balanceAfter).toLocaleString()} Coins</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="txn-card-right">
                    <div className={`txn-coins ${txn.isCredit ? 'credit' : 'debit'}`}>
                      {txn.isCredit ? `+${txn.coins}` : `-${txn.coins}`}
                      <span className="txn-coin-lbl"> Coins</span>
                    </div>

                    <div className="txn-id-tag">{txn.id}</div>

                    <div className="txn-status-badge">
                      <CheckCircle size={10} className="txn-check-icon" />
                      <span>{txn.status || 'Completed'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Close Button */}
        <button className="txn-close-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
