import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAddressesByUserId, createAddress, type Address } from '../services/customer'

interface CepDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
  currentCep: string
  onSelectCep: (cep: string, details?: { city?: string; state?: string; street?: string; neighborhood?: string }) => void
}

export default function CepDeliveryModal({
  isOpen,
  onClose,
  currentCep,
  onSelectCep
}: CepDeliveryModalProps) {
  const { user } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)

  // Modos de visualização: 'quick' (mudar CEP rápido), 'new' (cadastrar novo endereço), 'list' (meus endereços)
  const [activeTab, setActiveTab] = useState<'quick' | 'new' | 'list'>('quick')
  
  // Estado do CEP rápido
  const [quickCepInput, setQuickCepInput] = useState(currentCep || '')
  const [quickCepPreview, setQuickCepPreview] = useState<{ city: string; state: string; neighborhood?: string; street?: string } | null>(null)
  const [loadingQuick, setLoadingQuick] = useState(false)
  const [quickError, setQuickError] = useState('')

  // Estado do cadastro de novo endereço
  const [formCep, setFormCep] = useState('')
  const [formStreet, setFormStreet] = useState('')
  const [formNumber, setFormNumber] = useState('')
  const [formComplement, setFormComplement] = useState('')
  const [formNeighborhood, setFormNeighborhood] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('')
  const [formLabel, setFormLabel] = useState('Casa')
  const [loadingCepForm, setLoadingCepForm] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [formError, setFormError] = useState('')

  // Lista de endereços do usuário
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  // Máscara de CEP (00000-000)
  const formatCep = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 8)
    if (numbers.length > 5) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
    }
    return numbers
  }

  // Carregar endereços salvos quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setQuickCepInput(currentCep || '')
      setQuickError('')
      setFormError('')
      
      if (user?.id) {
        setLoadingAddresses(true)
        getAddressesByUserId(user.id)
          .then(addrs => {
            setSavedAddresses(addrs || [])
            if (addrs && addrs.length > 0 && !currentCep) {
              setActiveTab('list')
            }
          })
          .catch(err => console.error('Erro ao carregar endereços:', err))
          .finally(() => setLoadingAddresses(false))
      }
    }
  }, [isOpen, user?.id, currentCep])

  // Fechar no clique fora ou tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Consulta automática do CEP rápido ao digitar 8 números
  const handleQuickCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setQuickCepInput(formatted)
    setQuickError('')

    const clean = formatted.replace(/\D/g, '')
    if (clean.length === 8) {
      setLoadingQuick(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (data.erro) {
          setQuickError('CEP não encontrado. Verifique o número digitado.')
          setQuickCepPreview(null)
        } else {
          setQuickCepPreview({
            city: data.localidade || '',
            state: data.uf || '',
            neighborhood: data.bairro || '',
            street: data.logradouro || ''
          })
        }
      } catch {
        setQuickError('Não foi possível validar o CEP online.')
      } finally {
        setLoadingQuick(false)
      }
    } else {
      setQuickCepPreview(null)
    }
  }

  // Salvar CEP rápido
  const handleSaveQuickCep = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = quickCepInput.replace(/\D/g, '')
    if (clean.length < 8) {
      setQuickError('Informe um CEP válido com 8 dígitos.')
      return
    }

    const formatted = formatCep(clean)
    onSelectCep(formatted, quickCepPreview || undefined)
    onClose()
  }

  // Consulta automática de CEP no formulário de cadastro
  const handleFormCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setFormCep(formatted)
    setFormError('')

    const clean = formatted.replace(/\D/g, '')
    if (clean.length === 8) {
      setLoadingCepForm(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (data.erro) {
          setFormError('CEP não encontrado. Preencha os campos manualmente.')
        } else {
          if (data.logradouro) setFormStreet(data.logradouro)
          if (data.bairro) setFormNeighborhood(data.bairro)
          if (data.localidade) setFormCity(data.localidade)
          if (data.uf) setFormState(data.uf)
        }
      } catch {
        setFormError('Falha ao consultar CEP online. Digite o endereço manualmente.')
      } finally {
        setLoadingCepForm(false)
      }
    }
  }

  // Salvar novo endereço completo
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCep = formCep.replace(/\D/g, '')
    if (cleanCep.length < 8) {
      setFormError('Informe um CEP válido com 8 números.')
      return
    }
    if (!formStreet.trim() || !formNumber.trim() || !formCity.trim() || !formState.trim()) {
      setFormError('Preencha os campos obrigatórios: Rua, Número, Cidade e UF.')
      return
    }

    setSavingAddress(true)
    setFormError('')

    try {
      const formattedCep = formatCep(cleanCep)

      if (user?.id) {
        await createAddress({
          user_id: user.id,
          label: formLabel || 'Entrega',
          street: formStreet.trim(),
          number: formNumber.trim(),
          complement: formComplement.trim() || undefined,
          neighborhood: formNeighborhood.trim() || 'Centro',
          city: formCity.trim(),
          state: formState.trim().toUpperCase(),
          zip_code: formattedCep,
          is_default: true
        })
      }

      onSelectCep(formattedCep, {
        city: formCity.trim(),
        state: formState.trim().toUpperCase(),
        street: formStreet.trim(),
        neighborhood: formNeighborhood.trim()
      })
      onClose()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar endereço.')
    } finally {
      setSavingAddress(false)
    }
  }

  // Selecionar um endereço da lista de endereços salvos
  const handleSelectSavedAddress = (addr: Address) => {
    onSelectCep(addr.zip_code, {
      city: addr.city,
      state: addr.state,
      street: addr.street,
      neighborhood: addr.neighborhood
    })
    onClose()
  }

  if (!isOpen) return null

  // A entrega é uma decisão rápida na vitrine: o modal mantém somente o CEP,
  // como no fluxo de compra. O endereço completo continua sendo tratado em /conta.
  const simpleDeliveryModal = (
    <div className="dsvia-cep-simple-overlay" role="dialog" aria-modal="true" aria-labelledby="cep-simple-title" onMouseDown={onClose}>
      <div className="dsvia-cep-simple-card" ref={modalRef} onMouseDown={event => event.stopPropagation()}>
        <button type="button" className="dsvia-cep-simple-close" onClick={onClose} aria-label="Fechar">×</button>
        <h3 id="cep-simple-title">Onde vamos entregar?</h3>
        <p>Assim, mostramos as melhores ofertas e prazos para a sua região.</p>
        <form onSubmit={handleSaveQuickCep}>
          <label htmlFor="cep-simple-input">Enviar para</label>
          <div className="dsvia-cep-simple-row">
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            </span>
            <input id="cep-simple-input" type="tel" inputMode="numeric" placeholder="CEP" maxLength={9} value={quickCepInput} onChange={handleQuickCepChange} autoFocus />
            <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei o meu CEP</a>
          </div>
          {quickError && <div className="dsvia-cep-simple-error">{quickError}</div>}
          <button type="submit" disabled={loadingQuick || quickCepInput.replace(/\D/g, '').length < 8}>{loadingQuick ? 'Buscando…' : 'Confirmar'}</button>
        </form>
      </div>
    </div>
  )

  if (simpleDeliveryModal) return simpleDeliveryModal

  return (
    <div className="dsvia-cep-modal-overlay" aria-modal="true" role="dialog">
      <div className="dsvia-cep-popover dsvia-cep-modal-panel" ref={modalRef}>
        {/* Cabeçalho do Popover */}
        <div className="dsvia-cep-header">
          <div className="dsvia-cep-header-title-group">
            <h3 className="dsvia-cep-popover-title">Onde você quer receber suas compras?</h3>
            <p className="dsvia-cep-popover-desc">
              Informe seu CEP para ver fretes, prazos e produtos disponíveis para a sua localização.
            </p>
          </div>
          <button
            type="button"
            className="dsvia-cep-close-btn"
            onClick={onClose}
            aria-label="Fechar janela de CEP"
          >
            ✕
          </button>
        </div>

        {/* Card do CEP / Endereço Ativo Atual (se já definido) */}
        {currentCep && (
          <div className="dsvia-cep-active-card">
            <div className="dsvia-cep-active-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
            </div>
            <div className="dsvia-cep-active-info">
              <span className="dsvia-cep-active-label">Local de entrega atual:</span>
              <strong className="dsvia-cep-active-value">CEP: {currentCep}</strong>
            </div>
            <span className="dsvia-cep-active-badge">Ativo</span>
          </div>
        )}

        {/* Barra de Abas de Ação */}
        <div className="dsvia-cep-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quick'}
            className={`dsvia-cep-tab-btn ${activeTab === 'quick' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            Mudar CEP
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'new'}
            className={`dsvia-cep-tab-btn ${activeTab === 'new' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            + Cadastrar endereço
          </button>
          {user && savedAddresses.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'list'}
              className={`dsvia-cep-tab-btn ${activeTab === 'list' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              Meus endereços ({savedAddresses.length})
            </button>
          )}
        </div>

        {/* ── ABA 1: MUDAR CEP RÁPIDO ── */}
        {activeTab === 'quick' && (
          <div className="dsvia-cep-tab-content">
            <form className="dsvia-cep-quick-form" onSubmit={handleSaveQuickCep}>
              <label htmlFor="modal-cep-input" className="dsvia-cep-input-label">
                Digite o CEP de entrega:
              </label>
              <div className="dsvia-cep-form-row">
                <input
                  id="modal-cep-input"
                  type="text"
                  className="dsvia-cep-input"
                  placeholder="00000-000"
                  aria-label="CEP de entrega"
                  inputMode="numeric"
                  maxLength={9}
                  value={quickCepInput}
                  onChange={handleQuickCepChange}
                  autoFocus
                />
                <button
                  type="submit"
                  className="dsvia-cep-submit"
                  disabled={loadingQuick || quickCepInput.replace(/\D/g, '').length < 8}
                >
                  {loadingQuick ? 'Buscando...' : 'Aplicar'}
                </button>
              </div>

              {/* Preview da Localização Encontrada */}
              {quickCepPreview && (
                <div className="dsvia-cep-preview-box">
                  <span className="dsvia-cep-preview-icon">✓</span>
                  <div className="dsvia-cep-preview-text">
                    <strong>{quickCepPreview.city} - {quickCepPreview.state}</strong>
                    {quickCepPreview.neighborhood && <span>{quickCepPreview.neighborhood}</span>}
                    {quickCepPreview.street && <span>{quickCepPreview.street}</span>}
                  </div>
                </div>
              )}

              {quickError && (
                <div className="dsvia-cep-error-msg">{quickError}</div>
              )}

              <div className="dsvia-cep-footer-links">
                <a
                  href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dsvia-cep-link"
                >
                  Não sei meu CEP
                </a>
              </div>
            </form>
          </div>
        )}

        {/* ── ABA 2: CADASTRAR NOVO ENDEREÇO ── */}
        {activeTab === 'new' && (
          <div className="dsvia-cep-tab-content">
            <form className="dsvia-cep-full-form" onSubmit={handleSaveNewAddress}>
              <div className="dsvia-cep-field-group">
                <label className="dsvia-cep-input-label">CEP *</label>
                <div className="dsvia-cep-form-row">
                  <input
                    type="text"
                    className="dsvia-cep-input"
                    placeholder="00000-000"
                    maxLength={9}
                    inputMode="numeric"
                    value={formCep}
                    onChange={handleFormCepChange}
                    required
                  />
                  {loadingCepForm && <span className="dsvia-cep-mini-spinner">Buscando...</span>}
                </div>
              </div>

              <div className="dsvia-cep-field-group">
                <label className="dsvia-cep-input-label">Rua / Logradouro *</label>
                <input
                  type="text"
                  className="dsvia-cep-input"
                  placeholder="Ex: Av. Paulista"
                  value={formStreet}
                  onChange={(e) => setFormStreet(e.target.value)}
                  required
                />
              </div>

              <div className="dsvia-cep-grid-2">
                <div className="dsvia-cep-field-group">
                  <label className="dsvia-cep-input-label">Número *</label>
                  <input
                    type="text"
                    className="dsvia-cep-input"
                    placeholder="123"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="dsvia-cep-field-group">
                  <label className="dsvia-cep-input-label">Complemento</label>
                  <input
                    type="text"
                    className="dsvia-cep-input"
                    placeholder="Apto 42"
                    value={formComplement}
                    onChange={(e) => setFormComplement(e.target.value)}
                  />
                </div>
              </div>

              <div className="dsvia-cep-field-group">
                <label className="dsvia-cep-input-label">Bairro</label>
                <input
                  type="text"
                  className="dsvia-cep-input"
                  placeholder="Bairro"
                  value={formNeighborhood}
                  onChange={(e) => setFormNeighborhood(e.target.value)}
                />
              </div>

              <div className="dsvia-cep-grid-2">
                <div className="dsvia-cep-field-group">
                  <label className="dsvia-cep-input-label">Cidade *</label>
                  <input
                    type="text"
                    className="dsvia-cep-input"
                    placeholder="Cidade"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                  />
                </div>
                <div className="dsvia-cep-field-group" style={{ maxWidth: '80px' }}>
                  <label className="dsvia-cep-input-label">UF *</label>
                  <input
                    type="text"
                    className="dsvia-cep-input"
                    placeholder="SP"
                    maxLength={2}
                    value={formState}
                    onChange={(e) => setFormState(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div className="dsvia-cep-field-group">
                <label className="dsvia-cep-input-label">Identificação (Ex: Casa, Trabalho)</label>
                <input
                  type="text"
                  className="dsvia-cep-input"
                  placeholder="Casa"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                />
              </div>

              {formError && <div className="dsvia-cep-error-msg">{formError}</div>}

              <div className="dsvia-cep-form-actions">
                <button
                  type="button"
                  className="dsvia-cep-cancel-btn"
                  onClick={() => setActiveTab('quick')}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="dsvia-cep-submit dsvia-cep-submit-full"
                  disabled={savingAddress}
                >
                  {savingAddress ? 'Salvando...' : 'Salvar e usar este endereço'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── ABA 3: MEUS ENDEREÇOS SALVOS (USUÁRIO LOGADO) ── */}
        {activeTab === 'list' && (
          <div className="dsvia-cep-tab-content">
            {loadingAddresses ? (
              <div className="dsvia-cep-loading-state">Carregando seus endereços...</div>
            ) : savedAddresses.length > 0 ? (
              <div className="dsvia-cep-address-list">
                {savedAddresses.map((addr) => {
                  const isSelected = currentCep.replace(/\D/g, '') === addr.zip_code.replace(/\D/g, '')
                  return (
                    <div
                      key={addr.id}
                      className={`dsvia-cep-address-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectSavedAddress(addr)}
                    >
                      <div className="dsvia-cep-radio-indicator">
                        {isSelected && <div className="dsvia-cep-radio-dot" />}
                      </div>
                      <div className="dsvia-cep-item-details">
                        <div className="dsvia-cep-item-header">
                          <strong>{addr.label || 'Entrega'}</strong>
                          {addr.is_default && <span className="dsvia-cep-default-tag">Padrão</span>}
                        </div>
                        <p className="dsvia-cep-item-text">
                          {addr.street}, {addr.number} {addr.complement ? ` - ${addr.complement}` : ''}
                        </p>
                        <p className="dsvia-cep-item-sub">
                          {addr.neighborhood} - {addr.city}/{addr.state} • CEP {addr.zip_code}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="dsvia-cep-empty-addresses">
                <p>Nenhum endereço cadastrado na sua conta ainda.</p>
                <button
                  type="button"
                  className="dsvia-cep-submit"
                  onClick={() => setActiveTab('new')}
                >
                  Cadastrar meu primeiro endereço
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rodapé informativo para quem não está logado */}
        {!user && (
          <div className="dsvia-cep-login-prompt">
            <span>Já tem uma conta TEKNIX?</span>
            <Link to="/login" onClick={onClose} className="dsvia-cep-login-link">
              Fazer login para ver seus endereços
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
