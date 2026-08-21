'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useInternalChat } from '@/contexts/InternalChatContext'
import {
  CheckSquare,
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ShoppingCart,
  ExternalLink,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react'

export default function AtividadesPage() {
  const { tasks, createTask, updateTaskStatus, collaborators, conversations } = useInternalChat()
  const [filterTab, setFilterTab] = useState<'MY_TASKS' | 'WAITING' | 'DONE' | 'ALL'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedId, setAssignedId] = useState(collaborators[0]?.id || '')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH')
  const [relatedOrder, setRelatedOrder] = useState('')
  const [channelId, setChannelId] = useState(conversations[0]?.id || '')

  const filteredTasks = tasks.filter(t => {
    if (filterTab === 'DONE') return t.status === 'DONE'
    if (filterTab === 'WAITING') return t.status === 'WAITING' || t.status === 'IN_PROGRESS'
    if (filterTab === 'MY_TASKS') return t.assigned_to.name.includes('Alison') || t.status !== 'DONE'
    return true
  })

  const handleCreate = async () => {
    if (!title.trim()) return
    const assignedColab = collaborators.find(c => c.id === assignedId) || collaborators[0]
    await createTask({
      title,
      description,
      priority,
      assigned_to: assignedColab,
      related_order_number: relatedOrder || undefined,
      conversation_id: channelId || undefined
    })
    setShowCreateModal(false)
    setTitle('')
    setDescription('')
    setRelatedOrder('')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-200 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#111] tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#111]" />
            <span>Central de Atividades & Tarefas Operacionais</span>
          </h1>
          <p className="text-xs text-[#666] mt-0.5">
            Gerenciamento e delegação de tarefas de separação, emissão de NF-e e SAC entre colaboradores
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-[#111] hover:bg-[#222] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#B5F500]" />
          <span>Atribuir Nova Tarefa</span>
        </button>
      </div>

      {/* Abas e Contadores */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3 shadow-2xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
        {[
          { id: 'ALL', label: 'Todas as Atividades', count: tasks.length },
          { id: 'MY_TASKS', label: 'Minhas Tarefas', count: tasks.filter(t => t.status !== 'DONE').length },
          { id: 'WAITING', label: 'Em Andamento / Aguardando', count: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING').length },
          { id: 'DONE', label: 'Concluídas', count: tasks.filter(t => t.status === 'DONE').length },
        ].map(tab => {
          const isActive = filterTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#111] text-white shadow-xs'
                  : 'bg-[#f8f9fa] hover:bg-[#eee] text-[#555]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-[#e6e6e6] text-[#444]'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de Atividades */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-[#e6e6e6] text-center text-[#888] space-y-2">
            <CheckSquare className="w-10 h-10 text-[#ccc] mx-auto" />
            <p className="text-sm font-bold text-[#333]">Nenhuma atividade nesta categoria</p>
            <p className="text-xs text-[#777]">Todas as tarefas foram concluídas ou atribuídas.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isDone = task.status === 'DONE'
            const priorityConfig = {
              URGENT: { label: 'URGENTE', bg: 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]' },
              HIGH: { label: 'ALTA', bg: 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]' },
              MEDIUM: { label: 'MÉDIA', bg: 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]' },
              LOW: { label: 'BAIXA', bg: 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]' },
            }[task.priority]

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-[#fafafa] border-[#e6e6e6] opacity-75'
                    : 'bg-white border-[#e2e8f0] shadow-2xs hover:border-[#111]'
                }`}
              >
                {/* Dados da Tarefa */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => updateTaskStatus(task.id, isDone ? 'IN_PROGRESS' : 'DONE')}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
                      isDone
                        ? 'bg-[#16a34a] border-[#16a34a] text-white'
                        : 'border-[#cbd5e1] hover:border-[#111] bg-white'
                    }`}
                  >
                    {isDone && <Check className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-black ${isDone ? 'line-through text-[#888]' : 'text-[#1e293b]'}`}>
                        {task.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${priorityConfig.bg}`}>
                        {priorityConfig.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748b] leading-relaxed max-w-2xl">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#64748b] pt-1 flex-wrap font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#3483fa]" /> Responsável: <strong className="text-[#1e293b]">{task.assigned_to.name}</strong>
                      </span>
                      {task.related_order_number && (
                        <span className="flex items-center gap-1 font-mono text-[#1e293b]">
                          <ShoppingCart className="w-3.5 h-3.5 text-[#16a34a]" /> Pedido: {task.related_order_number}
                        </span>
                      )}
                      <span className="text-[#94a3b8]">
                        Criado há {new Date(task.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f1f5f9]">
                  {task.related_order_number && (
                    <Link
                      href="/pedidos"
                      className="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-xs font-bold text-[#1e293b] rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <span>Abrir Pedido</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#64748b]" />
                    </Link>
                  )}

                  <button
                    onClick={() => updateTaskStatus(task.id, isDone ? 'TODO' : 'DONE')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDone
                        ? 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                        : 'bg-[#111] hover:bg-[#222] text-white shadow-2xs'
                    }`}
                  >
                    {isDone ? 'Reabrir' : 'Concluir ✓'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Atribuir Tarefa */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-[#e6e6e6]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="text-sm font-black text-[#111] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#3483fa]" /> Atribuir Nova Atividade
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#888] hover:text-[#111]">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">Título da Atividade:</label>
                <input
                  type="text"
                  placeholder="Ex: Emitir NF-e do Pedido #MLB-2000008741"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#111]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">Instruções / Observações:</label>
                <textarea
                  placeholder="Ex: O cliente solicitou a inclusão do CPF na nota para garantia..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#111] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#333] block mb-1">Responsável:</label>
                  <select
                    value={assignedId}
                    onChange={e => setAssignedId(e.target.value)}
                    className="w-full h-10 px-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#111] bg-white"
                  >
                    {collaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#333] block mb-1">Prioridade:</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full h-10 px-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#111] bg-white"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#333] block mb-1">Pedido Relacionado (opcional):</label>
                  <input
                    type="text"
                    placeholder="Ex: MLB-2000008741"
                    value={relatedOrder}
                    onChange={e => setRelatedOrder(e.target.value)}
                    className="w-full h-10 px-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#111]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#333] block mb-1">Enviar Card no Chat do Canal:</label>
                  <select
                    value={channelId}
                    onChange={e => setChannelId(e.target.value)}
                    className="w-full h-10 px-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#111] bg-white"
                  >
                    {conversations.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f0f0]">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-[#666]">Cancelar</button>
              <button onClick={handleCreate} disabled={!title.trim()} className="px-5 py-2 bg-[#111] text-white rounded-xl text-xs font-bold disabled:opacity-50">Atribuir Tarefa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
