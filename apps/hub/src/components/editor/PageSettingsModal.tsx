import React, { useState } from 'react'
import type { Page } from '../../types/pageBuilder'

interface Props {
  page: Page
  onSave: (updates: Partial<Page>) => void
  onClose: () => void
}

export default function PageSettingsModal({ page, onSave, onClose }: Props) {
  const [title, setTitle] = useState(page.title || '')
  const [slug, setSlug] = useState(page.slug || '')
  const [seoTitle, setSeoTitle] = useState(page.seo_title || '')
  const [seoDesc, setSeoDesc] = useState(page.seo_description || '')
  const [isLandingMode, setIsLandingMode] = useState(page.is_landing_mode || false)

  const handleSave = () => {
    onSave({
      title,
      slug,
      seo_title: seoTitle,
      seo_description: seoDesc,
      is_landing_mode: isLandingMode
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#1d1d1f', color: '#fff', padding: '32px', borderRadius: '16px',
        width: '500px', maxWidth: '90vw', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Configurações da Página</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#86868b', marginBottom: '6px' }}>Título Interno (HUB)</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #424245', background: '#000', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#86868b', marginBottom: '6px' }}>URL Slug</label>
            <input 
              value={slug} 
              onChange={e => setSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #424245', background: '#000', color: '#fff' }}
              placeholder="ex: minha-pagina-nova"
            />
            <span style={{ fontSize: '0.75rem', color: '#6e6e73', marginTop: '4px', display: 'block' }}>A página será acessível em: /{slug}</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #424245', margin: '8px 0' }} />

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#86868b', marginBottom: '6px' }}>Título SEO (Aba do Navegador / Google)</label>
            <input 
              value={seoTitle} 
              onChange={e => setSeoTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #424245', background: '#000', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#86868b', marginBottom: '6px' }}>Descrição SEO (Google)</label>
            <textarea 
              value={seoDesc} 
              onChange={e => setSeoDesc(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #424245', background: '#000', color: '#fff', resize: 'vertical' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #424245', margin: '8px 0' }} />

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isLandingMode} 
                onChange={e => setIsLandingMode(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Modo Landing Page</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#86868b' }}>Oculta o Header e Footer globais do site, deixando apenas o conteúdo desta página.</span>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '980px', border: '1px solid #424245', background: 'transparent', color: '#fff', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '10px 24px', borderRadius: '980px', border: 'none', background: '#0a84ff', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
