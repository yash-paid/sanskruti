import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, CheckCircle } from 'lucide-react';
import { fetchUserLedger } from '../firebase/rewardService';

export default function TransactionsModal({ uid, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (uid) {
      setIsLoading(true);
      fetchUserLedger(uid)
        .then((realTxns) => {
          if (isMounted) {
            setTransactions(realTxns || []);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn('Failed to load user ledger:', err);
          if (isMounted) {
            setTransactions([]);
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

  const filtered = transactions.filter((txn) => {
    if (filter === 'credit') return txn.isCredit;
    if (filter === 'debit') return !txn.isCredit;
    return true;
  });

  return (
    <div className="transactions-modal-overlay" role="dialog" aria-modal="true">
      <div className="transactions-modal-container">
        {/* Modal Header */}
        <div className="transactions-modal-header">
          <button className="txn-back-btn" onClick={onClose} aria-label="Back">
            <ArrowLeft size={20} color="#fff" />
          </button>
          <h2 className="txn-modal-title">Transaction History</h2>
          <div style={{ width: 28 }} />
        </div>

        {/* Filter Chips */}
        <div className="txn-filter-row">
          <button
            className={`txn-filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`txn-filter-chip ${filter === 'credit' ? 'active' : ''}`}
            onClick={() => setFilter('credit')}
          >
            Coins Added
          </button>
          <button
            className={`txn-filter-chip ${filter === 'debit' ? 'active' : ''}`}
            onClick={() => setFilter('debit')}
          >
            Calls Spent
          </button>
        </div>

        {/* Transactions List */}
        <div className="txn-list">
          {isLoading ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#c9b4d5' }}>
              <div style={{ marginBottom: 8 }}>Loading transactions...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#c9b4d5' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#f3e8ff', marginBottom: 4 }}>
                No transactions yet.
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Recharge coins or make calls to see your history here.
              </div>
            </div>
          ) : (
            filtered.map((txn) => (
              <div key={txn.id} className="txn-card">
                <div className="txn-card-left">
                  <div className={`txn-icon-wrap ${txn.isCredit ? 'credit' : 'debit'}`}>
                    {txn.isCredit ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>
                  <div className="txn-details">
                    <div className="txn-title">{txn.title}</div>
                    <div className="txn-date">{txn.date}</div>
                    <div className="txn-id-tag">{txn.id}</div>
                  </div>
                </div>

                <div className="txn-card-right">
                  <div className={`txn-coins ${txn.isCredit ? 'credit' : 'debit'}`}>
                    {txn.isCredit ? `+${txn.coins}` : `-${txn.coins}`}
                    <span className="txn-coin-lbl"> Coins</span>
                  </div>
                  {txn.amount && <div className="txn-amount">{txn.amount}</div>}
                  <div className="txn-status-badge">
                    <CheckCircle size={11} className="txn-check-icon" />
                    <span>{txn.status || 'Success'}</span>
                  </div>
                </div>
              </div>
            ))
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
