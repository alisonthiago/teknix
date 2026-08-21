'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useInternalChat } from '@/contexts/InternalChatContext'
import MessageCardRenderer from '@/components/internal-chat/MessageCardRenderer'
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Paperclip,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  ShoppingCart,
  User,
  Clock,
  MoreVertical,
  PlusCircle
} from 'lucide-react'

export default function ConversasPage() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    createConversation,
    collaborators,
    markAsRead,
    currentUser
  } = useInternalChat()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD' | 'GROUP' | 'DIRECT'>('ALL')
  const [input, setInput] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newConvName, setNewConvName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (activeConversation) {
      markAsRead(activeConversation.id)
    }
  }, [messages, activeConversation, markAsRead])

  const filteredConversations = conversations.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType === 'UNREAD') return c.unread_count > 0
    if (filterType === 'GROUP') return c.type === 'GROUP'
    if (filterType === 'DIRECT') return c.type === 'DIRECT'
    return true
  })

  const handleSend = async () => {
    if (!input.trim() || !activeConversation) return
    const text = input
    setInput('')
    await sendMessage(activeConversation.id, text, 'TEXT')
  }

  const handleCreateNew = async () => {
    if (!newConvName.trim() || selectedMembers.length === 0) return
    await createConversation(newConvName, selectedMembers.length > 1 ? 'GROUP' : 'DIRECT', selectedMembers)
    setShowNewModal(false)
    setNewConvName('')
    setSelectedMembers([])
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col space-y-3 animate-in fade-in duration-200 pb-2">
      {/* Top Header Clean */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#111] tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#111]" />
            <span>Conversas & Chat Operacional</span>
          </h1>
          <p className="text-xs text-[#666] mt-0.5">
            Comunicação interna em tempo real entre equipes, pedidos e notas fiscais
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conversa</span>
        </button>
      </div>

      {/* Grid Principal Clean (2 Colunas: Sidebar + Chat) */}
      <div className="flex-1 flex bg-white rounded-2xl border border-[#e6e6e6] overflow-hidden shadow-2xs">
        
        {/* ========================================================================= */}
        {/* 📋 COLUNA 1: LISTA DE CONVERSAS & GRUPOS (LADO ESQUERDO) */}
        {/* ========================================================================= */}
        <div className="w-80 sm:w-96 border-r border-[#f0f0f0] flex flex-col bg-[#fafafa] shrink-0">
          {/* Busca & Filtros */}
          <div className="p-3 border-b border-[#eee] bg-white space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#888] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar conversa ou grupo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-[#f8fafc] border border-[#d0d7de] rounded-xl text-xs text-[#333] focus:outline-none focus:bg-white focus:border-[#16a34a] transition-all"
              />
            </div>

            {/* Filtros de Aba Clean */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'UNREAD', label: 'Não Lidas' },
                { id: 'GROUP', label: 'Grupos' },
                { id: 'DIRECT', label: 'Diretas' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                     filterType === f.id
                       ? 'bg-[#16a34a] text-white shadow-sm'
                       : 'text-[#666] hover:bg-[#f0f0f0] hover:text-[#111]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f0f0f0]">
            {filteredConversations.map(conv => {
              const isActive = activeConversation?.id === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv)
                    markAsRead(conv.id)
                  }}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                    isActive ? 'bg-white border-l-4 border-l-[#16a34a] shadow-sm' : 'hover:bg-[#f5f5f5]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] flex items-center justify-center text-xs font-black">
                      {conv.type === 'GROUP' ? <Users className="w-4 h-4 text-[#16a34a]" /> : conv.name.slice(0, 1)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#16a34a] rounded-full ring-2 ring-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#111] truncate">{conv.name}</p>
                      {conv.last_message && (
                        <span className="text-[10px] text-[#888]">
                          {new Date(conv.last_message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#666] truncate mt-0.5">
                      {conv.last_message ? conv.last_message.content : 'Nenhuma mensagem ainda'}
                    </p>
                  </div>

                  {conv.unread_count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#16a34a] text-white shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 💬 COLUNA 2: ÁREA DE CHAT EM TEMPO REAL (SPACIOUS & CLEAN) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-white">
          {activeConversation ? (
            <>
              {/* Header do Chat Clean */}
              <div className="p-3.5 border-b border-[#f0f0f0] flex items-center justify-between bg-white shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] flex items-center justify-center text-xs font-extrabold">
                    {activeConversation.type === 'GROUP' ? <Users className="w-4 h-4 text-[#16a34a]" /> : activeConversation.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#111]">{activeConversation.name}</h3>
                    <p className="text-[10px] text-[#16a34a] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Online e Sincronizado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#64748b]">
                    <span>{activeConversation.members.length} participantes</span>
                  </div>
                </div>
              </div>

              {/* Linha do Tempo das Mensagens Clean */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#f8fafc]">
                {messages.map(msg => (
                  <MessageCardRenderer
                    key={msg.id}
                    message={msg}
                    isMe={msg.sender_id === currentUser?.id || (!currentUser?.id && msg.sender_id === 'user-alison')}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de Digitação Clean */}
              <div className="p-3.5 bg-white border-t border-[#f0f0f0] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escreva uma mensagem para a equipe..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    className="flex-1 h-11 px-4 bg-[#f8fafc] border border-[#d0d7de] rounded-xl text-xs text-[#1e293b] focus:outline-none focus:bg-white focus:border-[#16a34a] transition-all"
                  />

                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-11 px-5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-40"
                  >
                    <span>Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[#777] text-xs px-1">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => alert('Selecione uma imagem ou foto de pedido')}
                      className="p-1 rounded-lg hover:bg-[#f0f0f0] hover:text-[#111] flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#16a34a]" /> Foto
                    </button>
                    <button 
                      onClick={() => alert('Selecione um PDF ou documento')}
                      className="p-1 rounded-lg hover:bg-[#f0f0f0] hover:text-[#111] flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#3483fa]" /> Arquivo
                    </button>
                  </div>
                  <span className="text-[10px] text-[#999]">Pressione Enter para enviar</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#999]">
              <MessageSquare className="w-12 h-12 mb-3 text-[#ccc]" />
              <h3 className="text-sm font-bold text-[#333]">Selecione uma conversa</h3>
              <p className="text-xs text-[#777] mt-1 max-w-sm">
                Escolha um canal ou colaborador à esquerda para conversar e colaborar em tempo real.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Criação de Conversa */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-[#e6e6e6]" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-[#111]">Criar Nova Conversa ou Grupo</h3>
            <div>
              <label className="text-xs font-bold text-[#333] block mb-1">Nome da Conversa:</label>
              <input
                type="text"
                placeholder="Ex: 📦 Conferência e Triagem"
                value={newConvName}
                onChange={e => setNewConvName(e.target.value)}
                className="w-full h-10 px-3 border border-[#d0d7de] rounded-xl text-xs focus:outline-none focus:border-[#16a34a]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#333] block mb-1">Selecione os Participantes:</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {collaborators.map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#fafafa] cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(c.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedMembers([...selectedMembers, c.id])
                        else setSelectedMembers(selectedMembers.filter(id => id !== c.id))
                      }}
                      className="accent-[#16a34a]"
                    />
                    <span className="font-bold">{c.name}</span>
                    <span className="text-[#888]">({c.role})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-[#666]">Cancelar</button>
              <button onClick={handleCreateNew} disabled={!newConvName.trim() || selectedMembers.length === 0} className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold disabled:opacity-50">Criar Conversa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
