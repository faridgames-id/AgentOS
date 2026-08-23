import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Filter, Gamepad2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../services/api'

interface Account {
  id: string
  email: string
  namaPenjual: string
  pembeli: string
  game: string
  hargaBeli: number
  tanggalMasuk: string
  password: string
  catatan: string
  bulanMasuk: string
  tanggalJual: string
  loginVia: string
  targetJual: number
  spec: string
  device: string
  rank: string
  hargaJual: number
  status: 'Ready' | 'Terjual' | 'Cicilan'
}

interface Summary {
  total_items: number
  ff_count: number
  ml_count: number
  ready_count: number
  terjual_count: number
  cicilan_count: number
  total_modal: number
  total_target: number
  total_jual: number
  potential_profit: number
}

export default function StockManager() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [filter, setFilter] = useState<'all' | 'ff' | 'ml' | 'Ready' | 'Terjual' | 'Cicilan'>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    namaPenjual: '',
    game: 'Free Fire',
    password: '',
    loginVia: 'Google',
    hargaBeli: 0,
    targetJual: 0,
    hargaJual: 0,
    spec: '',
    device: '',
    rank: 'Heroic',
    catatan: '',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    bulanMasuk: new Date().toLocaleDateString('id-ID', { month: 'long' }),
    tanggalJual: '',
    status: 'Ready' as const,
    pembeli: '',
  })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [accountsRes, summaryRes] = await Promise.all([
        api.getStock(),
        api.getStockSummary()
      ])
      setAccounts(accountsRes.items || [])
      setSummary(summaryRes)
    } catch (err) {
      console.error('Failed to load stock:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAdd = async () => {
    if (!formData.email || !formData.namaPenjual || !formData.password) {
      alert('Mohon isi email, nama penjual, dan password!')
      return
    }
    
    setSubmitting(true)
    try {
      await api.addStockItem(formData)
      setShowForm(false)
      setFormData({
        email: '',
        namaPenjual: '',
        game: 'Free Fire',
        password: '',
        loginVia: 'Google',
        hargaBeli: 0,
        targetJual: 0,
        hargaJual: 0,
        spec: '',
        device: '',
        rank: 'Heroic',
        catatan: '',
        tanggalMasuk: new Date().toISOString().split('T')[0],
        bulanMasuk: new Date().toLocaleDateString('id-ID', { month: 'long' }),
        tanggalJual: '',
        status: 'Ready',
        pembeli: '',
      })
      loadData()
    } catch (err) {
      console.error('Failed to add account:', err)
      alert('Gagal menambahkan akun!')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus akun ini?')) return
    try {
      await api.deleteStockItem(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }
  
  const filteredAccounts = accounts.filter(a => {
    if (filter === 'all') return true
    if (filter === 'ff') return a.game === 'Free Fire'
    if (filter === 'ml') return a.game === 'Mobile Legends'
    return a.status === filter
  })
  
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Ready': return <CheckCircle size={16} className="text-green-400" />
      case 'Terjual': return <XCircle size={16} className="text-red-400" />
      case 'Cicilan': return <AlertCircle size={16} className="text-yellow-400" />
      default: return null
    }
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ready': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Terjual': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Cicilan': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black text-white mb-2 font-display">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">ZEPHRA</span>
            <span className="text-slate-400 text-2xl ml-2">Stock Management</span>
          </h1>
          <p className="text-slate-400">Farid Shop Enterprise · Track your FF & ML accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
        >
          <Plus size={20} />
          Add Account
        </button>
      </motion.div>
      
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <p className="text-slate-400 text-sm">Total Accounts</p>
            <p className="text-3xl font-black text-white mt-1">{summary.total_items}</p>
            <p className="text-xs text-slate-500 mt-1">{summary.ff_count} FF / {summary.ml_count} ML</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-sm">💰 Total Modal</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{formatRupiah(summary.total_modal)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-sm">🎯 Target Jual</p>
            <p className="text-xl font-black text-blue-400 mt-1">{formatRupiah(summary.total_target)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-sm">✨ Profit Potential</p>
            <p className="text-xl font-black text-purple-400 mt-1">{formatRupiah(summary.potential_profit)}</p>
          </div>
        </div>
      )}
      
      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 font-display">Add New Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Info */}
              <input
                type="text"
                placeholder="Email *"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Nama Penjual *"
                value={formData.namaPenjual}
                onChange={e => setFormData({...formData, namaPenjual: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={formData.game}
                onChange={e => setFormData({...formData, game: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Free Fire">🔥 Free Fire</option>
                <option value="Mobile Legends">⚔️ Mobile Legends</option>
              </select>
              
              {/* Password & Login */}
              <input
                type="text"
                placeholder="Password *"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={formData.loginVia}
                onChange={e => setFormData({...formData, loginVia: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Google">Google</option>
                <option value="Moonton">Moonton</option>
                <option value="Facebook">Facebook</option>
              </select>
              <input
                type="date"
                value={formData.tanggalMasuk}
                onChange={e => setFormData({...formData, tanggalMasuk: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              />
              
              {/* Pricing */}
              <input
                type="number"
                placeholder="Harga Beli *"
                value={formData.hargaBeli || ''}
                onChange={e => setFormData({...formData, hargaBeli: parseInt(e.target.value) || 0})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="number"
                placeholder="Target Jual *"
                value={formData.targetJual || ''}
                onChange={e => setFormData({...formData, targetJual: parseInt(e.target.value) || 0})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="number"
                placeholder="Harga Jual (jika terjual)"
                value={formData.hargaJual || ''}
                onChange={e => setFormData({...formData, hargaJual: parseInt(e.target.value) || 0})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              
              {/* Details */}
              <select
                value={formData.rank}
                onChange={e => setFormData({...formData, rank: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Heroic">Heroic</option>
                <option value="Mythic">Mythic</option>
                <option value="Legend">Legend</option>
                <option value="Epik">Epik</option>
              </select>
              <input
                type="text"
                placeholder="Device"
                value={formData.device}
                onChange={e => setFormData({...formData, device: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Ready">✅ Ready</option>
                <option value="Terjual">❌ Terjual</option>
                <option value="Cicilan">💳 Cicilan</option>
              </select>
              
              {/* Full Width Fields */}
              <textarea
                placeholder="Spec/Detail Hero & Skin..."
                value={formData.spec}
                onChange={e => setFormData({...formData, spec: e.target.value})}
                className="md:col-span-2 lg:col-span-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none h-20"
              />
              <textarea
                placeholder="Catatan (optional)"
                value={formData.catatan}
                onChange={e => setFormData({...formData, catatan: e.target.value})}
                className="md:col-span-2 lg:col-span-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none h-16"
              />
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-transform disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={18} className="text-slate-400" />
        {(['all', 'ff', 'ml', 'Ready', 'Terjual', 'Cicilan'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              filter === f 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {f === 'all' && 'All'}
            {f === 'ff' && '🔥 FF'}
            {f === 'ml' && '⚔️ ML'}
            {f === 'Ready' && '✅ Ready'}
            {f === 'Terjual' && '❌ Terjual'}
            {f === 'Cicilan' && '💳 Cicilan'}
          </button>
        ))}
        <span className="ml-auto text-slate-500 text-sm">{filteredAccounts.length} accounts</span>
      </div>
      
      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Gamepad2 size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No accounts found</p>
          <p className="text-slate-500 text-sm mt-2">Click "Add Account" to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="glass-card p-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Game Icon */}
                <div className="text-3xl">
                  {account.game === 'Free Fire' ? '🔥' : '⚔️'}
                </div>
                
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white font-mono">{account.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(account.status)}`}>
                      {account.status}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium">{account.namaPenjual}</p>
                  <p className="text-slate-500 text-sm truncate">{account.spec || account.catatan}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>📱 {account.device || 'N/A'}</span>
                    <span>🎮 {account.rank || 'N/A'}</span>
                    <span>🔐 {account.loginVia}</span>
                  </div>
                </div>
                
                {/* Pricing */}
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-400">{formatRupiah(account.hargaBeli)}</p>
                  <p className="text-xs text-slate-500">Modal</p>
                  <p className="text-sm font-bold text-blue-400 mt-1">{formatRupiah(account.targetJual)}</p>
                  <p className="text-xs text-slate-500">Target</p>
                </div>
                
                {/* Actions */}
                <button
                  onClick={() => handleDelete(account.id!)}
                  className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
