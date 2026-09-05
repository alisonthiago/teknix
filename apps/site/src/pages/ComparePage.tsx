import { Editable } from '../components/page-widgets/PageWidgets'
import { useCompare } from '../context/CompareContext'
import { Link } from 'react-router-dom'
import { Trash2, ArrowLeft } from 'lucide-react'
import './ComparePage.css'

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompare()

  if (items.length === 0) {
    return (
      <div className="compare-page-container">
        <div className="compare-page-empty">
          <Editable as="h1" widgetId="comparepage-1">Comparar Produtos</Editable>
          <Editable as="p" widgetId="comparepage-2">Nenhum produto selecionado para comparação.</Editable>
          <Link to="/produtos" className="compare-page-back-btn">
            <ArrowLeft size={16} />
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    )
  }

  const allSpecKeys = new Set<string>()
  items.forEach(product => {
    if (product.specifications) {
      Object.keys(product.specifications).forEach(key => allSpecKeys.add(key))
    }
  })

  return (
    <div className="compare-page-container">
      <div className="compare-page-header">
        <Editable as="h1" widgetId="comparepage-3">Comparar Produtos</Editable>
        <div className="compare-page-actions">
          <button onClick={clearCompare} className="compare-page-clear-btn">
            <Trash2 size={16} />
            Limpar tudo
          </button>
          <Link to="/produtos" className="compare-page-add-btn">
            + Adicionar produto
          </Link>
        </div>
      </div>

      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-table-label">Produto</th>
              {items.map(product => (
                <th key={product.id} className="compare-table-product">
                  <div className="compare-product-card">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="compare-product-remove"
                      aria-label={`Remover ${product.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link to={`/produtos/${product.slug}`} className="compare-product-link">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="compare-product-image"
                      />
                      <h3 className="compare-product-name">{product.name}</h3>
                      {product.brand && (
                        <span className="compare-product-brand">{product.brand}</span>
                      )}
                      <div className="compare-product-price">
                        {product.promo_price ? (
                          <>
                            <span className="compare-price-promo">
                              R$ {product.promo_price.toFixed(2)}
                            </span>
                            <span className="compare-price-original">
                              R$ {product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="compare-price-current">
                            R$ {product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.some(p => p.sku) && (
              <tr>
                <td className="compare-table-label">SKU</td>
                {items.map(product => (
                  <td key={product.id} className="compare-table-value">
                    {product.sku || '—'}
                  </td>
                ))}
              </tr>
            )}
            {items.some(p => p.category) && (
              <tr>
                <td className="compare-table-label">Categoria</td>
                {items.map(product => (
                  <td key={product.id} className="compare-table-value">
                    {product.category || '—'}
                  </td>
                ))}
              </tr>
            )}
            {Array.from(allSpecKeys).map(key => (
              <tr key={key}>
                <td className="compare-table-label">{key}</td>
                {items.map(product => (
                  <td key={product.id} className="compare-table-value">
                    {product.specifications?.[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
