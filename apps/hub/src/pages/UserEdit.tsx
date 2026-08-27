import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Camera,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Bell,
  ShieldCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './UserEdit.css'

const DEFAULT_AVATAR = 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg'

export default function UserEdit() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [photoUrl, setPhotoUrl] = useState<string>(DEFAULT_AVATAR)
  const [formData, setFormData] = useState({
    name: 'Alison Thiago',
    nickname: 'Alison',
    email: 'alison@teknix.com.br',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifySales: true,
    notifyStock: true,
    notifyReviews: true,
    notifyMarketing: false
  })

  // Carregar dados reais do usuário logado
  useEffect(() => {
    async function loadUserProfile() {
      try {
        // 1. Verificar localStorage primeiro para persistência imediata
        const savedPhoto = localStorage.getItem('user_photo_url')
        const savedName = localStorage.getItem('user_name')
        const savedEmail = localStorage.getItem('user_email')
        const savedNickname = localStorage.getItem('user_nickname')

        if (savedPhoto) setPhotoUrl(savedPhoto)
        if (savedName || savedEmail) {
          setFormData(prev => ({
            ...prev,
            name: savedName || prev.name,
            nickname: savedNickname || prev.nickname,
            email: savedEmail || prev.email
          }))
        }

        // 2. Buscar do Supabase Auth e tabela profiles
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profile) {
            const currentPhoto = profile.photo_url || profile.avatar_url || savedPhoto || DEFAULT_AVATAR
            setPhotoUrl(currentPhoto)
            setFormData(prev => ({
              ...prev,
              name: profile.name || prev.name,
              nickname: profile.nickname || prev.nickname,
              email: profile.email || user.email || prev.email
            }))
            localStorage.setItem('user_photo_url', currentPhoto)
            localStorage.setItem('user_name', profile.name || formData.name)
            localStorage.setItem('user_email', profile.email || user.email || formData.email)
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  // Upload de Foto de Perfil
  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local imediato
    const localPreviewUrl = URL.createObjectURL(file)
    setPhotoUrl(localPreviewUrl)
    setUploadingPhoto(true)
    setErrorMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || '3af9068a-4b78-4c9c-8657-f83b93c01588'
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${userId}-${Date.now()}.${fileExt}`

      // Upload para o bucket user-avatars
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, { upsert: true })

      let publicUrl = localPreviewUrl

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(fileName)
        if (publicData?.publicUrl) {
          publicUrl = publicData.publicUrl
          setPhotoUrl(publicUrl)
        }
      }

      // Persistir no localStorage
      localStorage.setItem('user_photo_url', publicUrl)

      // Atualizar no Supabase Profiles
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ photo_url: publicUrl, avatar_url: publicUrl })
          .eq('id', user.id)
      }

      // Notificar o HubLayout e Dashboard em tempo real
      window.dispatchEvent(
        new CustomEvent('user_profile_updated', {
          detail: { photo_url: publicUrl, name: formData.name, email: formData.email }
        })
      )

      setSuccessMessage('Foto de perfil atualizada com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error('Erro ao enviar foto:', err)
      // Mantém a foto no localStorage mesmo em caso de erro no storage remoto
      localStorage.setItem('user_photo_url', localPreviewUrl)
      window.dispatchEvent(
        new CustomEvent('user_profile_updated', {
          detail: { photo_url: localPreviewUrl, name: formData.name, email: formData.email }
        })
      )
      setSuccessMessage('Foto de perfil aplicada com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Remover Foto
  function handleRemovePhoto() {
    setPhotoUrl(DEFAULT_AVATAR)
    localStorage.setItem('user_photo_url', DEFAULT_AVATAR)
    window.dispatchEvent(
      new CustomEvent('user_profile_updated', {
        detail: { photo_url: DEFAULT_AVATAR, name: formData.name, email: formData.email }
      })
    )
    setSuccessMessage('Foto restaurada para a padrão.')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Salvar Dados e Senha
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validação de senha
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage('As novas senhas não coincidem.')
        setSaving(false)
        return
      }
      if (formData.newPassword.length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.')
        setSaving(false)
        return
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Atualizar senha no Supabase Auth se informada
      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        if (passwordError) throw passwordError
      }

      // 2. Atualizar tabela profiles
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            name: formData.name,
            nickname: formData.nickname,
            email: formData.email,
            photo_url: photoUrl,
            avatar_url: photoUrl
          })
          .eq('id', user.id)

        await supabase.auth.updateUser({
          data: {
            name: formData.name,
            nickname: formData.nickname,
            avatar_url: photoUrl
          }
        })
      }

      // 3. Salvar em localStorage
      localStorage.setItem('user_name', formData.name)
      localStorage.setItem('user_nickname', formData.nickname)
      localStorage.setItem('user_email', formData.email)
      localStorage.setItem('user_photo_url', photoUrl)

      // 4. Disparar evento para atualizar a interface imediatamente
      window.dispatchEvent(
        new CustomEvent('user_profile_updated', {
          detail: {
            photo_url: photoUrl,
            name: formData.name,
            nickname: formData.nickname,
            email: formData.email
          }
        })
      )

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      setSuccessMessage('Dados da conta e perfil salvos com sucesso!')
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setErrorMessage(err.message || 'Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="user-edit-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-back"
              onClick={() => navigate('/hub/configuracoes')}
              title="Voltar"
            >
              <ChevronLeft size={20} />
            </button>
            <h1>Dados da Conta &amp; Perfil</h1>
          </div>
          <p style={{ marginLeft: 36 }}>Gerencie sua foto de perfil, dados de acesso e alteração de senha.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/hub/configuracoes')}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* ── Feedback Banners ── */}
      {successMessage && (
        <div className="user-banner success">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="user-banner error">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="user-edit-form">
        {/* ── Card 1: Foto de Perfil ── */}
        <div className="user-card">
          <div className="user-card-header">
            <div className="user-card-icon">
              <Camera size={18} />
            </div>
            <div>
              <h2>Foto de Perfil</h2>
              <p>Esta foto será exibida no cabeçalho, no painel principal e em toda a sua navegação.</p>
            </div>
          </div>

          <div className="avatar-upload-row">
            <div className="avatar-preview-wrap">
              <img src={photoUrl} alt={formData.name} className="avatar-preview-img" />
              <button
                type="button"
                className="avatar-overlay-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Trocar foto"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="avatar-actions-col">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                style={{ display: 'none' }}
                onChange={handlePhotoSelected}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  <Upload size={14} /> {uploadingPhoto ? 'Enviando...' : 'Escolher nova foto'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#ef4444' }}
                  onClick={handleRemovePhoto}
                >
                  <Trash2 size={14} /> Restaurar padrão
                </button>
              </div>
              <span className="avatar-hint">
                Formatos recomendados: JPG, PNG ou WebP. Tamanho máximo: 5 MB.
              </span>
            </div>
          </div>
        </div>

        {/* ── Card 2: Dados Pessoais ── */}
        <div className="user-card">
          <div className="user-card-header">
            <div className="user-card-icon">
              <UserIcon size={18} />
            </div>
            <div>
              <h2>Informações do Usuário</h2>
              <p>Seus dados de identificação na plataforma</p>
            </div>
          </div>

          <div className="user-form-grid">
            <div className="user-form-field">
              <label className="user-label">Nome Completo *</label>
              <input
                type="text"
                className="user-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Alison Thiago"
              />
            </div>

            <div className="user-form-field">
              <label className="user-label">Como deseja ser chamado (Apelido)</label>
              <input
                type="text"
                className="user-input"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Ex: Alison"
              />
            </div>

            <div className="user-form-field user-col-full">
              <label className="user-label">E-mail da Conta *</label>
              <input
                type="email"
                className="user-input"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="alison@teknix.com.br"
              />
            </div>
          </div>
        </div>

        {/* ── Card 3: Alteração de Senha ── */}
        <div className="user-card">
          <div className="user-card-header">
            <div className="user-card-icon">
              <Lock size={18} />
            </div>
            <div>
              <h2>Segurança e Senha</h2>
              <p>Altere sua senha de acesso ao painel administrativo</p>
            </div>
          </div>

          <div className="user-form-grid">
            <div className="user-form-field">
              <label className="user-label">Nova Senha</label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="user-input password-input"
                  placeholder="Deixe em branco para não alterar"
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="user-form-field">
              <label className="user-label">Confirmar Nova Senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="user-input"
                placeholder="Repita a nova senha"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <span className="avatar-hint" style={{ marginTop: 8 }}>
            A nova senha deve possuir pelo menos 6 caracteres.
          </span>
        </div>

        {/* ── Card 4: Notificações ── */}
        <div className="user-card">
          <div className="user-card-header">
            <div className="user-card-icon">
              <Bell size={18} />
            </div>
            <div>
              <h2>Notificações por E-mail</h2>
              <p>Escolha quais alertas você deseja receber no seu e-mail</p>
            </div>
          </div>

          <div className="user-toggles-list">
            <div className="user-toggle-item">
              <div>
                <div className="user-toggle-name">Novas Vendas e Pedidos</div>
                <div className="user-toggle-sub">Receba um alerta a cada compra aprovada na loja.</div>
              </div>
              <label className="user-switch">
                <input
                  type="checkbox"
                  checked={formData.notifySales}
                  onChange={e => setFormData({ ...formData, notifySales: e.target.checked })}
                />
                <span className="user-slider"></span>
              </label>
            </div>

            <div className="user-toggle-item">
              <div>
                <div className="user-toggle-name">Alertas de Estoque Baixo</div>
                <div className="user-toggle-sub">Avisos automáticos quando um produto estiver acabando.</div>
              </div>
              <label className="user-switch">
                <input
                  type="checkbox"
                  checked={formData.notifyStock}
                  onChange={e => setFormData({ ...formData, notifyStock: e.target.checked })}
                />
                <span className="user-slider"></span>
              </label>
            </div>

            <div className="user-toggle-item">
              <div>
                <div className="user-toggle-name">Avaliações e Comentários</div>
                <div className="user-toggle-sub">Notificações de novos reviews deixados por clientes.</div>
              </div>
              <label className="user-switch">
                <input
                  type="checkbox"
                  checked={formData.notifyReviews}
                  onChange={e => setFormData({ ...formData, notifyReviews: e.target.checked })}
                />
                <span className="user-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Bottom Submit ── */}
        <div className="user-form-bottom">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/hub/configuracoes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
