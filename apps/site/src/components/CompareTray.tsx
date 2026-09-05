import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '../context/CompareContext'
import './CompareTray.css'

export default function CompareTray() {
  const { items, removeFromCompare, clearCompare, totalItems } = useCompare()
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (totalItems > 0 && items.length === 1) {
      setIsExpanded(true)
    }
  }, [totalItems, items.length])

  if (totalItems === 0) return null

  return (
    <section className={`compare-tray-wrap ${isExpanded ? 'tray-open' : 'tray-closed'}`}>
      <div className="compare-tray-btn-container">
        <button
          className="compare-tray-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          Comparar ({totalItems})
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" className="ml-1">
            <path
              d="M8 11L3 6h10l-5 5z"
              fill="currentColor"
              transform={isExpanded ? 'rotate(180 8 8)' : ''}
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="compare-tray-body">
          <div className="compare-tray-left">
            <div className="compare-tray-info">
              Adicione até 4 produtos
            </div>
          </div>

          <div className="compare-tray-center">
            <ul className="compare-tray-list">
              {items.map(item => (
                <li key={item.id} className="compare-tray-item">
                  <div className="compare-tray-item-inner">
                    <button
                      className="compare-tray-remove-btn"
                      onClick={() => removeFromCompare(item.id)}
                      aria-label={`Remover ${item.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="16" fill="#141414" />
                        <g transform="translate(1 1)">
                          <line x1="10" y1="10" x2="20" y2="20" stroke="#fff" strokeLinecap="round" strokeWidth="1.5" />
                          <line x1="20" y1="10" x2="10" y2="20" stroke="#fff" strokeLinecap="round" strokeWidth="1.5" />
                        </g>
                      </svg>
                    </button>
                    <Link to={`/produtos/${item.slug}`} className="compare-tray-product-link">
                      <img
                        alt={item.name}
                        className="compare-tray-product-img"
                        src={item.image_url}
                      />
                    </Link>
                  </div>
                  <div title={item.name} className="compare-tray-product-name">
                    {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                  </div>
                </li>
              ))}

              {Array.from({ length: Math.max(0, 4 - totalItems) }).map((_, idx) => (
                <li key={`empty-${idx}`} className="compare-tray-item">
                  <div className="compare-tray-item-empty"></div>
                </li>
              ))}
            </ul>
          </div>

          <div className="compare-tray-right">
            <Link
              to={`/comparar?ids=${items.map(i => i.sku).join(',')}`}
              className={`compare-tray-compare-btn ${totalItems < 2 ? 'disabled' : ''}`}
              aria-label="Comparar"
            >
              Comparar
            </Link>
            <button
              onClick={clearCompare}
              aria-label="Limpar tudo"
              className="compare-tray-clear-btn"
            >
              Limpar tudo
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
