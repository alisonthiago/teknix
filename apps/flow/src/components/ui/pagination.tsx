'use client'

import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  itemName?: string
  className?: string
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'itens',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Gerar páginas visíveis com ellipsis inteligente
  const visiblePages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('ellipsis')
      if (!pages.includes(totalPages)) pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  if (totalItems === 0) return null

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 bg-white border border-[#e6e6e6] rounded-2xl shadow-2xs ${className}`}>
      {/* Esquerda: Contador de registros e seletor de limite por página */}
      <div className="flex items-center gap-3 text-xs text-[#666] flex-wrap justify-center sm:justify-start">
        <span>
          Mostrando <strong className="text-[#111] font-semibold">{startItem}</strong>–<strong className="text-[#111] font-semibold">{endItem}</strong> de <strong className="text-[#111] font-semibold">{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-[#e2e8f0]">
            <span className="text-[#888]">Exibir</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                onPageSizeChange(newSize)
                onPageChange(1) // Volta para primeira página ao mudar limite
              }}
              className="bg-white border border-[#d1d5db] text-[#111] text-xs font-semibold rounded-lg px-2 py-1 outline-none hover:border-[#111] focus:ring-1 focus:ring-[#111] transition-all cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} por pág.
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Direita: Controles de navegação de páginas */}
      <div className="flex items-center gap-1">
        {/* Primeira página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#555] hover:text-[#111] hover:bg-[#f4f4f5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Primeira página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Página anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f4f4f5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1 mx-1">
          {visiblePages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ell-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-[#999]">
                  …
                </span>
              )
            }
            const isCurrent = p === currentPage
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#444] hover:bg-[#f4f4f5] hover:text-[#111]'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Próxima página */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f4f4f5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#555] hover:text-[#111] hover:bg-[#f4f4f5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook auxiliar para facilitar a paginação em qualquer tela
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize))

  // Se a lista filtrar e a página atual ficar fora do total, ajusta para a última página
  const safePage = Math.min(currentPage, totalPages)
  if (safePage !== currentPage && safePage > 0) {
    setCurrentPage(safePage)
  }

  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) return []
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  return {
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems: items?.length || 0,
    totalPages,
  }
}
