import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2 } from 'lucide-react'
import { api } from '../services/api'

export default function Finance() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'income',
    category: 'Profit',
    description: ''
  })
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  useEffect(() => {
    Promise.all([
      api.getTransactions(),
      api.getSummary(),
    ]).then(([txData, summaryData]) => {
      setTransactions(txData.transactions)
      setSummary(summaryData)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to fetch:', err)
      setLoading(false)
    })
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    
    try {
      await api.addIncome({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description
      })
      
      // Refresh
      const [txData, summaryData] = await Promise.all([
        api.getTransactions(),
        api.getSummary(),
      ])
      setTransactions(txData.transactions)
      setSummary(summaryData)
      setShowForm(false)
      setFormData({ amount: '', type: 'income', category: 'Profit', description: '' })
    } catch (err) {
      console.error('Failed to add transaction:', err)
    } finally {
      setAdding(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    try {
      await api.deleteTransaction(id)
      const txData = await api.getTransactions()
      setTransactions(txData.transactions)
      const summaryData = await api.getSummary()
      setSummary(summaryData)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black text-white mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Finance</span> Tracker
          </h1>
          <p className="text-slate-400">Kelola income dan expense kamu</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-emerald-500/30"
        >
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </motion.div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border-emerald-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Income</p>
              <p className="text-3xl font-black text-emerald-400">
                Rp {summary?.total_income?.toLocaleString('id-ID') || 0}
              </p>
            </div>
          </div>
          <p className="text-emerald-400/60 text-sm">{summary?.income_count || 0} transactions</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card bg-gradient-to-br from-rose-500/20 to-rose-600/5 border-rose-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center">
              <TrendingDown size={28} className="text-rose-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Expense</p>
              <p className="text-3xl font-black text-rose-400">
                Rp {summary?.total_expense?.toLocaleString('id-ID') || 0}
              </p>
            </div>
          </div>
          <p className="text-rose-400/60 text-sm">{summary?.expense_count || 0} transactions</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card bg-gradient-to-br from-blue-500/20 to-blue-600/5 border-blue-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Wallet size={28} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Net Profit</p>
              <p className="text-3xl font-black text-blue-400">
                Rp {summary?.net_profit?.toLocaleString('id-ID') || 0}
              </p>
            </div>
          </div>
          <p className="text-blue-400/60 text-sm">All time</p>
        </motion.div>
      </div>
      
      {/* Add Transaction Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="income" className="bg-slate-800">Income</option>
                  <option value="expense" className="bg-slate-800">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Amount (Rp)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Profit, Jajan, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={adding}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {adding ? 'Saving...' : 'Save Transaction'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-white/5 rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      {/* Transactions List */}
      <div className="glass-card">
        <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.slice(0, 15).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: tx.type === 'income' ? '#10B98120' : '#EF444420' }}
                >
                  {tx.type === 'income' ? (
                    <TrendingUp size={20} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={20} className="text-rose-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">{tx.category || tx.description}</p>
                  <p className="text-slate-400 text-sm">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className="font-bold"
                    style={{ color: tx.type === 'income' ? '#10B981' : '#EF4444' }}
                  >
                    {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-slate-500 text-xs capitalize">{tx.type}</p>
                </div>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-rose-500/20"
                >
                  <Trash2 size={16} className="text-rose-400" />
                </button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
