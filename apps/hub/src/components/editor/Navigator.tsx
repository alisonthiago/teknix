import type { PageSection, PageContainer, PageWidget } from '../../types/pageBuilder'

interface Props {
  sections: PageSection[]
  selectedId: string | null
  onSelect: (type: 'section' | 'container' | 'widget', id: string) => void
  onClose: () => void
}

export default function Navigator({ sections, selectedId, onSelect, onClose }: Props) {
  return (
    <div className="navigator-panel">
      <div className="navigator-header">
        <span>Estrutura</span>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="navigator-tree">
        {sections
          .sort((a, b) => a.order - b.order)
          .map(section => (
            <div key={section.id}>
              <div
                className={`navigator-item level-0 ${selectedId === section.id ? 'selected' : ''}`}
                onClick={() => onSelect('section', section.id)}
              >
                <span className="nav-icon">▬</span>
                <span>Seção</span>
              </div>
              {(section.containers || [])
                .sort((a, b) => a.order - b.order)
                .map(container => (
                  <div key={container.id}>
                    <div
                      className={`navigator-item level-1 ${selectedId === container.id ? 'selected' : ''}`}
                      onClick={() => onSelect('container', container.id)}
                    >
                      <span className="nav-icon">▭</span>
                      <span>Container</span>
                    </div>
                    {(container.widgets || [])
                      .sort((a, b) => a.order - b.order)
                      .map(widget => (
                        <div
                          key={widget.id}
                          className={`navigator-item level-2 ${selectedId === widget.id ? 'selected' : ''}`}
                          onClick={() => onSelect('widget', widget.id)}
                        >
                          <span className="nav-icon">▢</span>
                          <span>{widget.type}</span>
                        </div>
                      ))
                    }
                  </div>
                ))
              }
            </div>
          ))
        }
        {sections.length === 0 && (
          <div className="navigator-empty">Nenhuma seção</div>
        )}
      </div>
    </div>
  )
}
