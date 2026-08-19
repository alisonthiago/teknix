'use client'

import { Input } from '@/components/ui/input'
import { useNotification } from '@/contexts/NotificationContext'
import { useState } from 'react'

export default function CnpjAutoFillInput({ defaultValue, required }: { defaultValue?: string, required?: boolean }) {
  const [value, setValue] = useState(defaultValue || '')
  const { notify } = useNotification()

  const handleBlur = async () => {
    const cleanCnpj = value.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) return

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
      if (!response.ok) return
      
      const data = await response.json()
      
      const setFieldValue = (id: string, val: string) => {
        const el = document.getElementById(id) as HTMLInputElement
        // Only override if the field is empty or if we want to force update
        // We will force update if it's currently empty, to not overwrite user edits
        if (el && !el.value && val) {
          el.value = val
        }
      }

      setFieldValue('legal_name', data.razao_social || '')
      setFieldValue('name', data.nome_fantasia || data.razao_social || '')
      setFieldValue('city', data.municipio || '')
      setFieldValue('state', data.uf || '')
      setFieldValue('phone', data.ddd_telefone_1 || '')
      
      notify({
        type: 'success',
        title: 'CNPJ Encontrado',
        message: 'Dados da Receita Federal preenchidos automaticamente.'
      })
    } catch (err) {
      console.error('Erro ao buscar CNPJ:', err)
    }
  }

  return (
    <Input
      id="cnpj"
      name="cnpj"
      required={required}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="00.000.000/0000-00"
      className="font-mono"
    />
  )
}
