'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface BasicCalculatorPopupProps {
  onClose: () => void
  initialPosition?: { x: number; y: number }
}

export default function BasicCalculatorPopup({ onClose, initialPosition }: BasicCalculatorPopupProps) {
  const [display, setDisplay] = useState('0')
  const [equation, setEquation] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)
  
  const [isMobile, setIsMobile] = useState(false)
  const [position, setPosition] = useState(initialPosition || { x: window.innerWidth > 1024 ? window.innerWidth - 320 : 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (isMobile) {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          onClose()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMobile, onClose])

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }
    }
    function handlePointerUp() {
      setIsDragging(false)
    }
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, dragOffset])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isMobile) {
      const target = e.target as HTMLElement
      if (target.tagName.toLowerCase() !== 'button' && !target.closest('button')) {
        setIsDragging(true)
        setDragOffset({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        })
        e.currentTarget.setPointerCapture(e.pointerId)
      }
    }
  }

  const handleNum = (num: string) => {
    setDisplay(prev => {
      if (num === '.') {
        if (prev.includes('.')) return prev
        return prev + '.'
      }
      return prev === '0' ? num : prev + num
    })
  }

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ')
    setDisplay('0')
  }

  const handleCalc = () => {
    try {
      if (!equation) return
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const cleanEq = (equation + display).replace(/,/g, '.')
      const result = new Function('return ' + cleanEq)()
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Erro')
      } else {
        const rounded = Math.round(result * 100000000) / 100000000
        setDisplay(String(rounded).replace('.', ','))
      }
      setEquation('')
    } catch {
      setDisplay('Erro')
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setEquation('')
  }

  const handleBackspace = () => {
    setDisplay(prev => {
      if (prev.length <= 1 || prev === 'Erro') return '0'
      return prev.slice(0, -1)
    })
  }

  const handlePct = () => {
    const num = parseFloat(display.replace(',', '.'))
    if (!isNaN(num)) {
      setDisplay(String(num / 100).replace('.', ','))
    }
  }

  // Suporte completo ao teclado físico do computador & NumPad
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const key = e.key

      if (key >= '0' && key <= '9') {
        e.preventDefault()
        handleNum(key)
      } else if (key === ',' || key === '.') {
        e.preventDefault()
        handleNum('.')
      } else if (key === '+') {
        e.preventDefault()
        handleOp('+')
      } else if (key === '-') {
        e.preventDefault()
        handleOp('-')
      } else if (key === '*' || key === 'x' || key === 'X') {
        e.preventDefault()
        handleOp('*')
      } else if (key === '/') {
        e.preventDefault()
        handleOp('/')
      } else if (key === '%') {
        e.preventDefault()
        handlePct()
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault()
        handleCalc()
      } else if (key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (key === 'Escape' || key === 'Delete' || key === 'c' || key === 'C') {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [display, equation])

  return (
    <div 
      ref={popupRef} 
      onPointerDown={handlePointerDown}
      className={`fixed z-[9999] bg-[#f5f5f5] p-5 pt-6 rounded-2xl w-[280px] sm:w-64 shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-[#e6e6e6] ${isMobile ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'cursor-move select-none'}`}
      style={isMobile ? {} : { left: position.x, top: position.y }}
    >
      {!isMobile && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#e6e6e6] text-[#999] hover:text-[#333] transition-colors"
          title="Fechar Calculadora"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <div className="bg-white p-3 rounded-xl mb-3 text-right border border-[#e6e6e6] shadow-sm">
        <div className="text-[10px] text-[#999] h-3 mb-1">{equation}</div>
        <div className="text-2xl font-bold text-[#333] tracking-tight truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={handleClear} className="col-span-2 py-2 rounded-xl bg-[#e6e6e6] hover:bg-[#d9d9d9] font-bold text-[#333] transition-colors">AC</button>
        <button onClick={handlePct} className="py-2 rounded-xl bg-[#e6e6e6] hover:bg-[#d9d9d9] font-bold text-[#333] transition-colors">%</button>
        <button onClick={() => handleOp('/')} className="py-2 rounded-xl bg-[#3483fa] hover:bg-[#2968c8] font-bold text-white transition-colors">÷</button>
        
        <button onClick={() => handleNum('7')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">7</button>
        <button onClick={() => handleNum('8')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">8</button>
        <button onClick={() => handleNum('9')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">9</button>
        <button onClick={() => handleOp('*')} className="py-2 rounded-xl bg-[#3483fa] hover:bg-[#2968c8] font-bold text-white transition-colors">×</button>
        
        <button onClick={() => handleNum('4')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">4</button>
        <button onClick={() => handleNum('5')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">5</button>
        <button onClick={() => handleNum('6')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">6</button>
        <button onClick={() => handleOp('-')} className="py-2 rounded-xl bg-[#3483fa] hover:bg-[#2968c8] font-bold text-white transition-colors">-</button>
        
        <button onClick={() => handleNum('1')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">1</button>
        <button onClick={() => handleNum('2')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">2</button>
        <button onClick={() => handleNum('3')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">3</button>
        <button onClick={() => handleOp('+')} className="py-2 rounded-xl bg-[#3483fa] hover:bg-[#2968c8] font-bold text-white transition-colors">+</button>
        
        <button onClick={() => handleNum('0')} className="col-span-2 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">0</button>
        <button onClick={() => handleNum('.')} className="py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#e6e6e6] font-bold text-lg text-[#333] shadow-sm transition-colors">,</button>
        <button onClick={handleCalc} className="py-2 rounded-xl bg-[#00a650] hover:bg-[#008a42] font-bold text-white transition-colors">=</button>
      </div>
    </div>
  )
}
