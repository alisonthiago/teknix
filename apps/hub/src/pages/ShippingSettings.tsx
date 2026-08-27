import { useState } from 'react'
import './ShippingSettings.css'

interface ShippingConfig {
  correios_sedex_active: boolean
  correios_pac_active: boolean
  correios_mini_active: boolean
  correios_contract_code: string
  correios_contract_password: string
  correios_additional_days: number
  correios_additional_price: number
  motoboy_active: boolean
  motoboy_price: number
  motoboy_time: string
  motoboy_title: string
  motoboy_zip_start: string
  motoboy_zip_end: string
  free_shipping_active: boolean
  free_shipping_min_value: number
  free_shipping_regions: string[]
}

const initialConfig: ShippingConfig = {
  correios_sedex_active: true,
  correios_pac_active: true,
  correios_mini_active: false,
  correios_contract_code: '',
  correios_contract_password: '',
  correios_additional_days: 0,
  correios_additional_price: 0,
  motoboy_active: false,
  motoboy_price: 15,
  motoboy_time: 'Até 4 horas',
  motoboy_title: 'Motoboy Express',
  motoboy_zip_start: '01000-000',
  motoboy_zip_end: '05999-999',
  free_shipping_active: false,
  free_shipping_min_value: 299,
  free_shipping_regions: ['sudeste', 'sul']
}

export default function ShippingSettings() {
  const [config, setConfig] = useState<ShippingConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  function updateConfig(field: keyof ShippingConfig, value: unknown) {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    setSaving(true)
    setMessage(null)
    
    // Simulating API call
    setTimeout(() => {
      setSaving(false)
      setMessage({ type: 'success', text: 'Configurações de entrega salvas com sucesso!' })
      
      setTimeout(() => setMessage(null), 3000)
    }, 1000)
  }

  return (
    <div className="shipping-settings-page">
      <div className="page-header">
        <div className="header-info">
          <h2>Entregas e Frete</h2>
          <p>Gerencie como você envia os produtos aos seus clientes</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`form-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-main">
          
          {/* CORREIOS */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Integração Correios</h3>
              <p className="card-subtitle">Serviços postais oficiais (Cálculo automático)</p>
            </div>
            <div className="card-body">
              <div className="switches-list">
                <div className="switch-item">
                  <div className="switch-info">
                    <strong>SEDEX</strong>
                    <span>Entrega expressa (média de 1 a 3 dias)</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={config.correios_sedex_active}
                      onChange={e => updateConfig('correios_sedex_active', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="switch-item">
                  <div className="switch-info">
                    <strong>PAC</strong>
                    <span>Entrega econômica (média de 5 a 15 dias)</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={config.correios_pac_active}
                      onChange={e => updateConfig('correios_pac_active', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="switch-item">
                  <div className="switch-info">
                    <strong>Mini Envios</strong>
                    <span>Para produtos pequenos (até 300g)</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={config.correios_mini_active}
                      onChange={e => updateConfig('correios_mini_active', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <div className="divider"></div>

              <h4>Contrato (Opcional)</h4>
              <p className="section-desc">Insira seus dados caso tenha tarifas exclusivas com os Correios</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Código Administrativo</label>
                  <input 
                    type="text" 
                    value={config.correios_contract_code}
                    onChange={e => updateConfig('correios_contract_code', e.target.value)}
                    placeholder="Ex: 12345678"
                  />
                </div>
                <div className="form-group">
                  <label>Senha</label>
                  <input 
                    type="password" 
                    value={config.correios_contract_password}
                    onChange={e => updateConfig('correios_contract_password', e.target.value)}
                    placeholder="Senha do SIGEP"
                  />
                </div>
              </div>

              <div className="divider"></div>

              <h4>Acréscimos (Gordura)</h4>
              <p className="section-desc">Adicionar dias ou valores extras no cálculo do frete para o cliente</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Dias extras (Manuseio)</label>
                  <div className="input-suffix">
                    <input 
                      type="number" 
                      value={config.correios_additional_days}
                      onChange={e => updateConfig('correios_additional_days', parseInt(e.target.value) || 0)}
                    />
                    <span>dias</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Valor extra (Embalagem)</label>
                  <div className="input-prefix">
                    <span>R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={config.correios_additional_price}
                      onChange={e => updateConfig('correios_additional_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOTOBOY / FRETE FIXO */}
          <div className="detail-card">
            <div className="card-header flex-header">
              <div>
                <h3>Logística Local (Motoboy)</h3>
                <p className="card-subtitle">Frete fixo para faixas de CEP específicas</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={config.motoboy_active}
                  onChange={e => updateConfig('motoboy_active', e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            {config.motoboy_active && (
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Título no Checkout</label>
                    <input 
                      type="text" 
                      value={config.motoboy_title}
                      onChange={e => updateConfig('motoboy_title', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Fixo</label>
                    <div className="input-prefix">
                      <span>R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={config.motoboy_price}
                        onChange={e => updateConfig('motoboy_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Prazo de Entrega</label>
                    <input 
                      type="text" 
                      value={config.motoboy_time}
                      onChange={e => updateConfig('motoboy_time', e.target.value)}
                      placeholder="Ex: Em até 4h"
                    />
                  </div>
                </div>
                
                <h4 style={{ marginTop: '20px' }}>Faixa de CEP Permitida</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>CEP Inicial</label>
                    <input 
                      type="text" 
                      value={config.motoboy_zip_start}
                      onChange={e => updateConfig('motoboy_zip_start', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="form-group">
                    <label>CEP Final</label>
                    <input 
                      type="text" 
                      value={config.motoboy_zip_end}
                      onChange={e => updateConfig('motoboy_zip_end', e.target.value)}
                      placeholder="99999-999"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TRANSPORTADORAS (EM BREVE) */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Transportadoras</h3>
              <p className="card-subtitle">Jadlog, Azul Cargo, Total Express</p>
            </div>
            <div className="card-body empty-integration">
              <div className="integration-icon">🚛</div>
              <h4>Conecte sua conta Kangu ou Melhor Envio</h4>
              <p>O módulo de transportadoras é gerido via integrações para calcular centenas de tabelas automaticamente.</p>
              <button className="btn btn-secondary">Explorar Integrações</button>
            </div>
          </div>
        </div>

        <div className="settings-sidebar">
          {/* FRETE GRÁTIS */}
          <div className="detail-card promo-card">
            <div className="card-header flex-header">
              <div>
                <h3>Frete Grátis</h3>
                <p className="card-subtitle">Promoção para o cliente</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={config.free_shipping_active}
                  onChange={e => updateConfig('free_shipping_active', e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            {config.free_shipping_active && (
              <div className="card-body">
                <div className="form-group">
                  <label>A partir de (R$)</label>
                  <div className="input-prefix">
                    <span>R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={config.free_shipping_min_value}
                      onChange={e => updateConfig('free_shipping_min_value', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Regiões atendidas</label>
                  <div className="checkbox-list">
                    {['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'].map(region => (
                      <label key={region} className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={config.free_shipping_regions.includes(region)}
                          onChange={e => {
                            if (e.target.checked) {
                              updateConfig('free_shipping_regions', [...config.free_shipping_regions, region])
                            } else {
                              updateConfig('free_shipping_regions', config.free_shipping_regions.filter(r => r !== region))
                            }
                          }}
                        />
                        <span className="checkbox-text">{region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="info-alert">
                  <strong>Atenção:</strong> Esta regra sobrepõe qualquer cálculo de transportadora no checkout se a condição for atingida.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
