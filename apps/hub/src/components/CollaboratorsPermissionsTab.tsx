import { useState, useEffect } from 'react'
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  Trash2,
  RefreshCw,
  Eye,
  Plus,
  Edit,
  Trash,
  Upload,
  Globe
} from 'lucide-react'
import {
  PermissionsService,
  CollaboratorProfile,
  HUB_PERMISSIONS_CATALOG,
  ROLE_PRESET_PERMISSIONS,
  ROLE_LABELS
} from '../services/permissionsService'
import './CollaboratorsPermissionsTab.css'

export default function CollaboratorsPermissionsTab() {
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([])
  const [selectedColabId, setSelectedColabId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<CollaboratorProfile['role']>('ADMIN')
  const [permissionsMap, setPermissionsMap] = useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal Novo Colaborador
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [newName, setNewName] = useState<string>('')
  const [newEmail, setNewEmail] = useState<string>('')
  const [newRole, setNewRole] = useState<CollaboratorProfile['role']>('EDITOR')
  const [creating, setCreating] = useState<boolean>(false)

  // Carrega lista inicial de colaboradores
  useEffect(() => {
    loadCollaborators()
  }, [])

  async function loadCollaborators() {
    setLoading(true)
    try {
      const list = await PermissionsService.getCollaborators()
      setCollaborators(list)
      if (list.length > 0 && !selectedColabId) {
        selectCollaborator(list[0])
      }
    } catch (e) {
      console.error('Erro ao carregar colaboradores:', e)
    } finally {
      setLoading(false)
    }
  }

  // Seleciona um colaborador e carrega suas permissões atuais
  async function selectCollaborator(colab: CollaboratorProfile) {
    setSelectedColabId(colab.id)
    setSelectedRole(colab.role)
    setFeedback(null)

    if (colab.role === 'ADMIN' || colab.is_master) {
      const allTrue: Record<string, boolean> = {}
      HUB_PERMISSIONS_CATALOG.forEach(p => {
        allTrue[p.code] = true
      })
      setPermissionsMap(allTrue)
    } else {
      const userPerms = await PermissionsService.getUserPermissions(colab.id)
      const basePreset = ROLE_PRESET_PERMISSIONS[colab.role] || []

      const finalMap: Record<string, boolean> = {}
      HUB_PERMISSIONS_CATALOG.forEach(p => {
        if (userPerms[p.code] !== undefined) {
          finalMap[p.code] = userPerms[p.code]
        } else {
          finalMap[p.code] = basePreset.includes(p.code)
        }
      })
      setPermissionsMap(finalMap)
    }
  }

  const selectedColab = collaborators.find(c => c.id === selectedColabId) || null

  // Troca de Perfil de Acesso (Aplica preset correspondente)
  function handleRoleChange(newRole: CollaboratorProfile['role']) {
    setSelectedRole(newRole)
    if (newRole === 'ADMIN') {
      const allTrue: Record<string, boolean> = {}
      HUB_PERMISSIONS_CATALOG.forEach(p => {
        allTrue[p.code] = true
      })
      setPermissionsMap(allTrue)
    } else if (newRole === 'CUSTOM') {
      // Mantém as permissões atuais como base
    } else {
      const presetCodes = ROLE_PRESET_PERMISSIONS[newRole] || []
      const newMap: Record<string, boolean> = {}
      HUB_PERMISSIONS_CATALOG.forEach(p => {
        newMap[p.code] = presetCodes.includes(p.code)
      })
      setPermissionsMap(newMap)
    }
  }

  // Toggle individual de permissão
  function handleTogglePermission(code: string) {
    if (selectedColab?.is_master) return // Proteção MASTER

    const currentVal = !!permissionsMap[code]
    const updatedMap = { ...permissionsMap, [code]: !currentVal }
    setPermissionsMap(updatedMap)

    // Se estiver em um preset fechado (ex: EDITOR) e mudar um switch, vira CUSTOM
    if (selectedRole !== 'CUSTOM') {
      setSelectedRole('CUSTOM')
    }
  }

  // Toggle de todas as permissões de um módulo específico
  function handleToggleModuleAll(moduleKey: string) {
    if (selectedColab?.is_master) return // Proteção MASTER

    const modulePerms = HUB_PERMISSIONS_CATALOG.filter(p => p.module === moduleKey)
    const allChecked = modulePerms.every(p => !!permissionsMap[p.code])

    const updatedMap = { ...permissionsMap }
    modulePerms.forEach(p => {
      updatedMap[p.code] = !allChecked
    })
    setPermissionsMap(updatedMap)

    if (selectedRole !== 'CUSTOM') {
      setSelectedRole('CUSTOM')
    }
  }

  // Salva no Supabase
  async function handleSavePermissions() {
    if (!selectedColab) return
    setSaving(true)
    setFeedback(null)

    const updatedColab: CollaboratorProfile = {
      ...selectedColab,
      role: selectedRole
    }

    const res = await PermissionsService.saveCollaboratorPermissions(updatedColab, permissionsMap)
    setSaving(false)

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Permissões de ${selectedColab.name} salvas com sucesso no banco de dados e aplicadas imediatamente!`
      })
      // Atualiza lista local
      setCollaborators(prev => prev.map(c => (c.id === selectedColab.id ? updatedColab : c)))
      setTimeout(() => setFeedback(null), 5000)
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Erro ao persistir permissões.'
      })
    }
  }

  // Criação de novo colaborador
  async function handleCreateCollaborator(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      alert('Preencha o nome e o e-mail do colaborador.')
      return
    }

    setCreating(true)
    const res = await PermissionsService.createCollaborator({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole
    })
    setCreating(false)

    if (res.success && res.collaborator) {
      setShowAddModal(false)
      setNewName('')
      setNewEmail('')
      setNewRole('EDITOR')
      const updatedList = await PermissionsService.getCollaborators()
      setCollaborators(updatedList)
      selectCollaborator(res.collaborator)
      setFeedback({
        type: 'success',
        message: `Colaborador ${res.collaborator.name} criado e configurado com sucesso!`
      })
    } else {
      alert(res.error || 'Erro ao cadastrar colaborador.')
    }
  }

  // Agrupa permissões por módulo
  const modulesList = Array.from(new Set(HUB_PERMISSIONS_CATALOG.map(p => p.module))).map(moduleKey => {
    const items = HUB_PERMISSIONS_CATALOG.filter(p => p.module === moduleKey)
    return {
      key: moduleKey,
      name: items[0]?.moduleName || moduleKey,
      items
    }
  })

  return (
    <div className="colab-permissions-container">
      {/* ── Header da Seção ── */}
      <div className="colab-header-row">
        <div>
          <h1 className="settings-main-title">Permissões dos Colaboradores</h1>
          <p className="settings-main-subtitle">
            Defina o perfil de acesso e controle exatamente o que cada membro da equipe pode visualizar, criar, editar, excluir ou publicar na loja.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <UserPlus size={15} /> Novo Colaborador
        </button>
      </div>

      {feedback && (
        <div className={`colab-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Grid Principal: Lista de Colaboradores (Esquerda) vs Matriz de Permissões (Direita) ── */}
      <div className="colab-main-grid">
        
        {/* ── 1. Coluna de Colaboradores ── */}
        <div className="colab-sidebar-card">
          <div className="colab-card-title-row">
            <h3 className="colab-card-title">Equipe ({collaborators.length})</h3>
            <button
              className="colab-refresh-btn"
              onClick={loadCollaborators}
              title="Recarregar do Supabase"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="colab-list">
            {collaborators.map(colab => {
              const isSelected = colab.id === selectedColabId
              return (
                <div
                  key={colab.id}
                  className={`colab-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectCollaborator(colab)}
                >
                  <div className="colab-avatar">
                    {colab.photo_url ? (
                      <img src={colab.photo_url} alt={colab.name} />
                    ) : (
                      colab.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="colab-item-info">
                    <div className="colab-item-name">
                      {colab.name}
                      {colab.is_master && <span className="badge-master">MASTER</span>}
                    </div>
                    <div className="colab-item-email">{colab.email}</div>
                    <div className="colab-item-role-badge">
                      {ROLE_LABELS[colab.role]?.name || colab.role}
                    </div>
                  </div>
                  <ChevronRight size={14} className="colab-item-arrow" />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 2. Coluna de Edição de Permissões ── */}
        <div className="colab-details-card">
          {selectedColab ? (
            <>
              {/* Header do Colaborador Selecionado */}
              <div className="colab-selected-header">
                <div className="colab-selected-meta">
                  <h2>{selectedColab.name}</h2>
                  <p>{selectedColab.email} • Status: <strong style={{ color: '#16a34a' }}>{selectedColab.status}</strong></p>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleSavePermissions}
                  disabled={saving || selectedColab.is_master}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={15} />
                  {saving ? 'Salvando no Banco...' : 'Salvar Alterações'}
                </button>
              </div>

              {selectedColab.is_master && (
                <div className="colab-master-alert">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Superadministrador Principal (MASTER)</strong>
                    <p>Este usuário possui acesso total permanente e protegido contra bloqueio acidental.</p>
                  </div>
                </div>
              )}

              {/* Seletor de Perfil de Acesso */}
              <div className="colab-role-section">
                <label className="colab-section-label">Perfil de Acesso do Colaborador</label>
                <div className="colab-role-cards-grid">
                  {(Object.keys(ROLE_LABELS) as Array<CollaboratorProfile['role']>).map(roleKey => {
                    const isCurrent = selectedRole === roleKey
                    const info = ROLE_LABELS[roleKey]
                    return (
                      <div
                        key={roleKey}
                        className={`colab-role-card ${isCurrent ? 'active' : ''}`}
                        onClick={() => !selectedColab.is_master && handleRoleChange(roleKey)}
                      >
                        <div className="colab-role-radio-row">
                          <input
                            type="radio"
                            name="colab_role"
                            checked={isCurrent}
                            onChange={() => {}}
                            disabled={selectedColab.is_master}
                          />
                          <span className="colab-role-name">{info.name}</span>
                        </div>
                        <p className="colab-role-desc">{info.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Matriz de Permissões por Módulo */}
              <div className="colab-matrix-section">
                <div className="colab-matrix-header-row">
                  <div>
                    <h3 className="colab-matrix-title">Permissões Detalhadas por Módulo</h3>
                    <p className="colab-matrix-desc">Controle fino para cada tela e ação do sistema TEKNIX.</p>
                  </div>
                </div>

                <div className="colab-modules-accordion">
                  {modulesList.map(mod => {
                    const allChecked = mod.items.every(p => !!permissionsMap[p.code])
                    return (
                      <div key={mod.key} className="colab-module-block">
                        <div className="colab-module-header">
                          <div className="colab-module-name-wrap">
                            <span className="colab-module-title">{mod.name}</span>
                            <span className="colab-module-count">({mod.items.length} permissões)</span>
                          </div>
                          
                          <button
                            type="button"
                            className="colab-select-all-btn"
                            onClick={() => handleToggleModuleAll(mod.key)}
                            disabled={selectedColab.is_master}
                          >
                            {allChecked ? 'Desmarcar todas' : 'Selecionar todas'}
                          </button>
                        </div>

                        <div className="colab-perms-grid">
                          {mod.items.map(perm => {
                            const isChecked = !!permissionsMap[perm.code]
                            return (
                              <label
                                key={perm.code}
                                className={`colab-perm-row ${isChecked ? 'checked' : ''}`}
                              >
                                <div className="colab-perm-left">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(perm.code)}
                                    disabled={selectedColab.is_master}
                                    className="colab-checkbox"
                                  />
                                  <div>
                                    <div className="colab-perm-label">{perm.label}</div>
                                    <div className="colab-perm-desc">{perm.description}</div>
                                  </div>
                                </div>
                                <span className={`colab-action-badge action-${perm.action}`}>
                                  {perm.actionLabel}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botão Inferior de Salvamento */}
              <div className="colab-bottom-bar">
                <button
                  className="btn btn-primary"
                  onClick={handleSavePermissions}
                  disabled={saving || selectedColab.is_master}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 160, justifyContent: 'center' }}
                >
                  <Save size={15} />
                  {saving ? 'Salvando no Banco...' : 'Salvar Alterações'}
                </button>
              </div>
            </>
          ) : (
            <div className="colab-empty-selection">
              <Users size={32} />
              <p>Selecione um colaborador na lista ao lado para editar suas permissões.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Adicionar Novo Colaborador ── */}
      {showAddModal && (
        <div className="colab-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="colab-modal-content" onClick={e => e.stopPropagation()}>
            <div className="colab-modal-header">
              <h3>Novo Colaborador</h3>
              <button className="colab-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCollaborator} className="colab-modal-form">
              <div className="colab-form-field">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Lucas Mendes"
                  className="settings-input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              <div className="colab-form-field">
                <label>E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex.: lucas@teknix.com.br"
                  className="settings-input"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>

              <div className="colab-form-field">
                <label>Perfil Inicial de Acesso</label>
                <select
                  className="settings-input"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                >
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="EDITOR">Editor de Conteúdo</option>
                  <option value="SALES">Vendas & Atendimento</option>
                  <option value="STOCK">Estoquista / Operacional</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              <div className="colab-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
