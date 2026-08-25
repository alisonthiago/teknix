import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'
import './ProductsList.css'

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  function toggleSelectAll() {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  function toggleSelect(id: string) {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id))
    } else {
      setSelectedProducts([...selectedProducts, id])
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="products-list-page">
      <div className="page-header">
        <div className="header-info">
          <h2>Produtos</h2>
          <p>{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <Link to="/hub/produtos/novo" className="btn btn-primary">
            <span>+</span> Adicionar produto
          </Link>
        </div>
      </div>

      <div className="products-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar produtos por nome ou SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selectedProducts.length > 0 && (
          <div className="selection-info">
            {selectedProducts.length} selecionado{selectedProducts.length !== 1 ? 's' : ''}
            <button className="btn-text" onClick={() => setSelectedProducts([])}>
              Limpar seleção
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Comece cadastrando seu primeiro produto</p>
          <Link to="/hub/produtos/novo" className="btn btn-primary">
            Adicionar produto
          </Link>
        </div>
      ) : (
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="col-product">Produto</th>
                <th className="col-stock">Estoque</th>
                <th className="col-price">Preço</th>
                <th className="col-promo">Promocional</th>
                <th className="col-status">Status</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className={selectedProducts.includes(product.id) ? 'selected' : ''}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </td>
                  <td className="col-product">
                    <div className="product-cell">
                      <div className="product-thumb">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          <div className="thumb-placeholder">📦</div>
                        )}
                      </div>
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="col-stock">
                    <span className={`stock-badge ${(product.stock || 0) <= 0 ? 'out' : (product.stock || 0) <= 5 ? 'low' : 'ok'}`}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td className="col-price">{formatPrice(product.price)}</td>
                  <td className="col-promo">
                    {product.promo_price ? formatPrice(product.promo_price) : '-'}
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <Link to={`/hub/produtos/editar/${product.id}`} className="action-btn">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
