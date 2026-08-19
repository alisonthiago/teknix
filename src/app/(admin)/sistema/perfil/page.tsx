'use client'

import { useState, useRef } from 'react'
import { Camera, User, Lock, Save, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'


interface Profile {
  id: string
  name: string
  nickname: string
  email: string
  role: string
  role_label: string
  status: string
  created_at: string
  last_login: string
  photo_url: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', GESTOR: 'Gestor', FINANCEIRO: 'Financeiro',
  ESTOQUE: 'Estoque', SEPARADOR: 'Separador', EXPEDICAO: 'Expedição',
  VENDEDOR: 'Vendedor', OPERADOR: 'Operador', VISUALIZADOR: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-[#f0f7ff] text-[#3483fa]',
  GESTOR: 'bg-[#f0f0ff] text-[#6c5ce7]',
  SEPARADOR: 'bg-[#fffaf0] text-[#e67e22]',
  FINANCEIRO: 'bg-[#f0fff4] text-[#38a169]',
  VENDEDOR: 'bg-[#fff5f5] text-[#e74c3c]',
  OPERADOR: 'bg-[#f5f5f5] text-[#666]',
}

export default function PerfilPage() {
  const { data: profile, loading, error } = useSupabaseQuery<Profile>(async (s) => {
    const { data: { user } } = await s.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')
    const { data, error } = await s.from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    return data as Profile
  }, [])

  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', nickname: '', email: '' })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', profile.id)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to upload photo:', err)
      alert(`Erro ao enviar foto: ${err.message || err}`)
    } finally {
      setUploadingPhoto(false)
    }
  }

  function startEditing() {
    if (profile) {
      setForm({ name: profile.name, nickname: profile.nickname, email: profile.email })
    }
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (!profile) return
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({ name: form.name, nickname: form.nickname, email: form.email }).eq('id', profile.id)
      if (error) throw error
      setEditing(false)
      window.location.reload()
    } catch {
      // save failed silently
    } finally {
      setSaving(false)
    }
  }

  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  async function handleChangePassword() {
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwords.new || !passwords.confirm) {
      setPasswordError('Preencha a nova senha.')
      return
    }

    if (passwords.new !== passwords.confirm) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    if (passwords.new.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setChangingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      })
      
      if (error) throw error
      
      setPasswordSuccess('Senha alterada com sucesso!')
      setPasswords({ current: '', new: '', confirm: '' })
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar a senha.')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto w-full">
        <div className="mb-4">
          <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Sistema
          </Link>
        </div>
        <div className="bg-white border border-[#e6e6e6] rounded-md p-6 text-center text-[13px] text-[#999]">Carregando perfil...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-[800px] mx-auto w-full">
        <div className="mb-4">
          <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Sistema
          </Link>
        </div>
        <div className="bg-white border border-[#e6e6e6] rounded-md p-6 text-center text-[13px] text-[#e74c3c]">Erro ao carregar perfil. {error || ''}</div>
      </div>
    )
  }

  const user = editing ? { ...profile, ...form } : profile

  return (
    <div className="max-w-[800px] mx-auto w-full">
      <div className="mb-4">
        <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Sistema
        </Link>
      </div>

      {saved && (
        <div className="mb-4 bg-[#f0fff4] border border-[#38a169]/20 rounded-md px-4 py-3 text-[13px] text-[#38a169] font-medium">
          Perfil salvo com sucesso!
        </div>
      )}

      {/* Header do perfil */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] flex items-center justify-center overflow-hidden relative">
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-[#999] animate-spin" />
              ) : profile.photo_url ? (
                <Image src={profile.photo_url} alt={profile.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
              ) : (
                <User className="w-8 h-8 text-[#ccc]" />
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-[20px] font-semibold text-[#333]">{user.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {user.nickname && <span className="text-[13px] text-[#999]">@{user.nickname}</span>}
                  {user.nickname && <span className="text-[10px] text-[#ccc]">•</span>}
                  <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${ROLE_COLORS[profile.role] || 'bg-[#f5f5f5] text-[#666]'}`}>
                    {ROLE_LABELS[profile.role] || profile.role}
                  </span>
                  <span className="text-[10px] text-[#ccc]">•</span>
                  <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${profile.status === 'ACTIVE' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
                    {profile.status === 'ACTIVE' ? 'Ativo' : profile.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => editing ? handleSave() : startEditing()}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8] transition-colors flex items-center gap-1.5 justify-center disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editing ? <><Save className="w-3.5 h-3.5" /> Salvar</> : 'Editar perfil'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-5 mb-4">
        <h3 className="text-[14px] font-semibold text-[#333] mb-4">Dados pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Nome completo</label>
            <input
              type="text"
              value={user.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={!editing}
              className={`w-full px-3 py-2 border rounded-md text-[13px] text-[#333] outline-none transition-colors ${
                editing ? 'border-[#3483fa] bg-white focus:ring-2 focus:ring-[#3483fa]/20' : 'border-[#e6e6e6] bg-[#fafafa]'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Apelido</label>
            <input
              type="text"
              value={user.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })}
              disabled={!editing}
              className={`w-full px-3 py-2 border rounded-md text-[13px] text-[#333] outline-none transition-colors ${
                editing ? 'border-[#3483fa] bg-white focus:ring-2 focus:ring-[#3483fa]/20' : 'border-[#e6e6e6] bg-[#fafafa]'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">E-mail</label>
            <input
              type="email"
              value={user.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={!editing}
              className={`w-full px-3 py-2 border rounded-md text-[13px] text-[#333] outline-none transition-colors ${
                editing ? 'border-[#3483fa] bg-white focus:ring-2 focus:ring-[#3483fa]/20' : 'border-[#e6e6e6] bg-[#fafafa]'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Função</label>
            <div className="w-full px-3 py-2 border border-[#e6e6e6] bg-[#fafafa] rounded-md text-[13px] text-[#666]">
              {ROLE_LABELS[profile.role] || profile.role}
            </div>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-5 mb-4">
        <h3 className="text-[14px] font-semibold text-[#333] mb-4">Segurança</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[#999] mb-1.5">Senha atual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/20 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#666]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#999] mb-1.5">Nova senha</label>
              <input
                type="password"
                value={passwords.new}
                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#999] mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md text-[13px] text-[#333] outline-none focus:border-[#3483fa] focus:ring-2 focus:ring-[#3483fa]/20 transition-colors"
              />
            </div>
          </div>
          {passwordError && <div className="text-[12px] text-[#e74c3c] mt-1">{passwordError}</div>}
          {passwordSuccess && <div className="text-[12px] text-[#38a169] mt-1">{passwordSuccess}</div>}
          <button 
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="px-4 py-2 bg-[#3483fa] text-white text-[12px] font-medium rounded-md hover:bg-[#2968c8] transition-colors flex items-center gap-1.5 mt-2 disabled:opacity-50"
          >
            {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Alterar senha
          </button>
        </div>
      </div>

      {/* Informações da conta */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-5">
        <h3 className="text-[14px] font-semibold text-[#333] mb-4">Informações da conta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
            <span className="text-[12px] text-[#999]">ID do usuário</span>
            <span className="text-[12px] font-mono text-[#666]">#{profile.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
            <span className="text-[12px] text-[#999]">Função</span>
            <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${ROLE_COLORS[profile.role] || 'bg-[#f5f5f5] text-[#666]'}`}>
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
            <span className="text-[12px] text-[#999]">Conta criada em</span>
            <span className="text-[12px] text-[#666]">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
            <span className="text-[12px] text-[#999]">Último acesso</span>
            <span className="text-[12px] text-[#666]">{profile.last_login ? new Date(profile.last_login).toLocaleString('pt-BR') : '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
            <span className="text-[12px] text-[#999]">Status</span>
            <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${profile.status === 'ACTIVE' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#f5f5f5] text-[#999]'}`}>
              {profile.status === 'ACTIVE' ? 'Ativo' : profile.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
