import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Building,
  Radio,
  Save,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './FiscalSettings.css'

export default function FiscalSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [settings, setSettings] = useState({
    razao_social: 'ALYSON THIAGO LOURENCO DA SILVA 41728401836',
    nome_fantasia: 'TEKNIX',
    cnpj: '38.068.360/0001-06',
    inscricao_estadual: '',
    regime_tributario: '1', // 1 = Simples Nacional
    ambiente_padrao: 'homologacao',
    serie_nfe: '1',
    proximo_numero_nfe: 1,
    emissao_automatica: false,
    emissao_apos_status: 'paid',
    endereco_logradouro: 'Avenida Paulista',
    endereco_numero: '1000',
    endereco_bairro: 'Bela Vista',
    endereco_municipio: 'São Paulo',
    endereco_uf: 'SP',
    endereco_cep: '01310-100',
  })

  const [focusConfig, setFocusConfig] = useState<any>(null)

  const webhookUrl = 'https://api.teknixbrasil.com.br/webhooks/focus-nfe'

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      // 1. Configurações Fiscais
      const { data: sData } = await supabase
        .from('store_fiscal_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle()

      if (sData) {
        setSettings((prev) => ({ ...prev, ...sData }))
      }

      // 2. Configurações da Integração Focus NFe
      const { data: cData } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('id', 'focus_nfe')
        .maybeSingle()

      if (cData) {
        setFocusConfig(cData)
      }
    } catch (err) {
      console.error('[FiscalSettings] Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedbackMsg(null)
    try {
      const { error } = await supabase
        .from('store_fiscal_settings')
        .upsert(
          {
            id: 'default',
            ...settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (error) throw error

      setFeedbackMsg({ type: 'success', text: 'Configurações fiscais salvas com sucesso!' })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Erro ao salvar: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      // Testa health check do webhook na API Central
      const res = await fetch(webhookUrl)
      const data = await res.json()
      if (res.ok && data.status === 'online') {
        setTestResult({
          ok: true,
          msg: 'Webhook e API Central online respondendo normalmente (HTTP 200).',
        })
      } else {
        setTestResult({
          ok: false,
          msg: `Resposta inesperada: ${data.message || JSON.stringify(data)}`,
        })
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        msg: `Falha ao conectar: ${err.message}`,
      })
    } finally {
      setTesting(false)
    }
  }

  function handleCopyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2500)
  }

  return (
    <div className="fiscal-settings-page">
      {/* Top Header */}
      <div className="fisc-header">
        <Link to="/hub/configuracoes" className="fisc-back-link">
          <ArrowLeft size={16} /> Voltar para Configurações
        </Link>
        <div className="fisc-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              className="btn-back-to-settings"
              onClick={() => navigate('/hub/configuracoes')}
              title="Voltar para Configurações"
              aria-label="Voltar para Configurações"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <button
            className="btn-fisc-save"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`fisc-feedback-box fisc-feedback-${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="fisc-loading">
          <RefreshCw size={24} className="spin text-blue" />
          <p>Carregando configurações fiscais...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="fisc-cards-layout">
          {/* CARD 1: STATUS DA INTEGRAÇÃO FOCUS NFE */}
          <div className="fisc-card">
            <div className="fisc-card-header">
              <div className="fisc-card-title-group">
                <ShieldCheck size={20} color="#2563eb" />
                <h2>Integração Focus NFe (SEFAZ)</h2>
              </div>
              <span className="fisc-status-pill connected">
                <CheckCircle2 size={13} /> CONECTADO
              </span>
            </div>

            <div className="fisc-card-body">
              <div className="fisc-grid-2">
                <div>
                  <label className="fisc-label">Ambiente Padrão de Emissão:</label>
                  <select
                    className="fisc-select"
                    value={settings.ambiente_padrao}
                    onChange={(e) => setSettings({ ...settings, ambiente_padrao: e.target.value })}
                  >
                    <option value="homologacao">Homologação (Testes SEFAZ sem valor fiscal)</option>
                    <option value="producao">Produção Oficial (Notas válidas com SEFAZ)</option>
                  </select>
                  <p className="fisc-hint">
                    Em homologação, as notas emitidas recebem tarja "SEM VALOR FISCAL" para fins de teste.
                  </p>
                </div>

                <div>
                  <label className="fisc-label">URL do Webhook da API Central:</label>
                  <div className="fisc-input-copy-group">
                    <input
                      type="text"
                      className="fisc-input"
                      value={webhookUrl}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn-fisc-copy"
                      onClick={handleCopyWebhook}
                      title="Copiar URL do Webhook"
                    >
                      {copiedWebhook ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="fisc-hint">
                    URL oficial cadastrada na Focus NFe para envio de autorizações e cancelamentos.
                  </p>
                </div>
              </div>

              {/* Botão Teste de Conexão */}
              <div className="fisc-test-connection-row">
                <button
                  type="button"
                  className="btn-fisc-test"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  <RefreshCw size={15} className={testing ? 'spin' : ''} />
                  {testing ? 'Testando Conexão...' : 'Testar Comunicação com Webhook'}
                </button>
                {testResult && (
                  <span className={`fisc-test-result ${testResult.ok ? 'success' : 'error'}`}>
                    {testResult.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {testResult.msg}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: MODO DE EMISSÃO DA NOTA */}
          <div className="fisc-card">
            <div className="fisc-card-header">
              <div className="fisc-card-title-group">
                <Radio size={20} color="#059669" />
                <h2>Modo de Emissão de NF-e</h2>
              </div>
            </div>

            <div className="fisc-card-body">
              <div className="fisc-radio-options">
                <label className={`fisc-radio-card ${!settings.emissao_automatica ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="emissao_modo"
                    checked={!settings.emissao_automatica}
                    onChange={() => setSettings({ ...settings, emissao_automatica: false })}
                  />
                  <div>
                    <strong>Emissão Manual (Recomendado)</strong>
                    <p>
                      O administrador confere o pedido e clica no botão "Emitir NF-e" na tela do pedido.
                      Garante controle total antes do envio para a SEFAZ.
                    </p>
                  </div>
                </label>

                <label className={`fisc-radio-card ${settings.emissao_automatica ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="emissao_modo"
                    checked={settings.emissao_automatica}
                    onChange={() => setSettings({ ...settings, emissao_automatica: true })}
                  />
                  <div>
                    <strong>Emissão Automática após Pagamento Aprovado</strong>
                    <p>
                      A NF-e é submetida automaticamente para autorização assim que o pagamento for aprovado
                      (apenas se todos os dados fiscais do cliente e produtos estiverem preenchidos).
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CARD 3: DADOS DA EMPRESA EMITENTE */}
          <div className="fisc-card">
            <div className="fisc-card-header">
              <div className="fisc-card-title-group">
                <Building size={20} color="#0f172a" />
                <h2>Dados da Empresa Emitente (TEKNIX)</h2>
              </div>
            </div>

            <div className="fisc-card-body">
              <div className="fisc-grid-3">
                <div>
                  <label className="fisc-label">Razão Social:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.razao_social}
                    onChange={(e) => setSettings({ ...settings, razao_social: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="fisc-label">Nome Fantasia:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.nome_fantasia}
                    onChange={(e) => setSettings({ ...settings, nome_fantasia: e.target.value })}
                  />
                </div>

                <div>
                  <label className="fisc-label">CNPJ:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.cnpj}
                    onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="fisc-grid-3" style={{ marginTop: 16 }}>
                <div>
                  <label className="fisc-label">Inscrição Estadual (IE):</label>
                  <input
                    type="text"
                    className="fisc-input"
                    placeholder="Ex: 123.456.789.111"
                    value={settings.inscricao_estadual}
                    onChange={(e) => setSettings({ ...settings, inscricao_estadual: e.target.value })}
                  />
                </div>

                <div>
                  <label className="fisc-label">Regime Tributário:</label>
                  <select
                    className="fisc-select"
                    value={settings.regime_tributario}
                    onChange={(e) => setSettings({ ...settings, regime_tributario: e.target.value })}
                  >
                    <option value="1">1 – Simples Nacional</option>
                    <option value="2">2 – Simples Nacional (excesso sublimite)</option>
                    <option value="3">3 – Regime Normal (Lucro Presumido / Real)</option>
                  </select>
                </div>

                <div>
                  <label className="fisc-label">Série da NF-e:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.serie_nfe}
                    onChange={(e) => setSettings({ ...settings, serie_nfe: e.target.value })}
                  />
                </div>
              </div>

              {/* Endereço Emitente */}
              <h3 className="fisc-subheading">Endereço da Empresa Emitente</h3>
              <div className="fisc-grid-3">
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="fisc-label">Logradouro:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.endereco_logradouro}
                    onChange={(e) => setSettings({ ...settings, endereco_logradouro: e.target.value })}
                  />
                </div>
                <div>
                  <label className="fisc-label">Número:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.endereco_numero}
                    onChange={(e) => setSettings({ ...settings, endereco_numero: e.target.value })}
                  />
                </div>
              </div>

              <div className="fisc-grid-3" style={{ marginTop: 16 }}>
                <div>
                  <label className="fisc-label">Bairro:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.endereco_bairro}
                    onChange={(e) => setSettings({ ...settings, endereco_bairro: e.target.value })}
                  />
                </div>
                <div>
                  <label className="fisc-label">Município / UF:</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="fisc-input"
                      value={settings.endereco_municipio}
                      onChange={(e) => setSettings({ ...settings, endereco_municipio: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="fisc-input"
                      value={settings.endereco_uf}
                      onChange={(e) => setSettings({ ...settings, endereco_uf: e.target.value.toUpperCase().slice(0, 2) })}
                      style={{ width: 60, textAlign: 'center' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="fisc-label">CEP:</label>
                  <input
                    type="text"
                    className="fisc-input"
                    value={settings.endereco_cep}
                    onChange={(e) => setSettings({ ...settings, endereco_cep: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
