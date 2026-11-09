import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Gift, CheckCircle, Clock } from 'lucide-react';
import { SAMPLE_TRANSACTIONS } from '../data/packages';

export default function TransactionsModal({ onClose }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'credit' | 'debit'

  const filtered = SAMPLE_TRANSACTIONS.filter((txn) => {
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
          {filtered.map((txn) => (
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
                  <span>{txn.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button className="txn-close-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

