import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function ObsidianSync() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)
  
  useEffect(() => {
    fetch('http://localhost:27125/vault/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch vault status:', err)
        setLoading(false)
      })
  }, [])
  
  const handleSync = async () => {
    try {
      const response = await fetch('http://localhost:27125/vault/finance/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: 9312000,
          expense: 541000,
          net: 8771000,
          month: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        })
      })
      
      if (response.ok) {
        setLastSync(new Date().toLocaleString('id-ID'))
      }
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw size={24} className="animate-spin text-cyan-400" />
      </div>
    )
  }
  
  return (
    <div className="glass-card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <BookOpen size={24} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Obsidian Sync</h3>
          <p className="text-slate-400 text-sm">Second Brain Integration</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <span className="text-slate-400">Vault Status</span>
          <span className={`flex items-center gap-2 ${status?.exists ? 'text-emerald-400' : 'text-rose-400'}`}>
            {status?.exists ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {status?.exists ? 'Connected' : 'Not Found'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <span className="text-slate-400">Total Notes</span>
          <span className="text-white font-bold">{status?.note_count || 0}</span>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <span className="text-slate-400">Last Updated</span>
          <span className="text-slate-300 text-sm">{status?.last_updated ? new Date(status.last_updated).toLocaleString('id-ID') : '-'}</span>
        </div>
        
        {lastSync && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-400 text-sm">✓ Synced at {lastSync}</p>
          </div>
        )}
        
        <button
          onClick={handleSync}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          Sync to Obsidian
        </button>
      </div>
    </div>
  )
}
