export interface Agent {
  id: number
  name: string
  role: string
  description: string
  icon: string
  status: 'idle' | 'working' | 'offline'
  current_task: string | null
  tasks_completed: number
  avatar_color: string
  model?: string
  badge?: string
  created_at?: string
}

export interface RunningModel {
  id: string
  name: string
  status: 'running' | 'idle' | 'offline'
  gpu_usage: number
  memory_usage: number
  uptime: string
  icon?: string
}
