'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection, Toggle } from '@/components/ConfigSubLayout'

export default function NotificacoesPage() {
  const [prefs, setPrefs] = useState({
    nova_venda: true, novo_pedido: true, pagamento: true, pedido_cancelado: true,
    estoque_baixo: true, sem_estoque: true, margem_baixa: true, venda_prejuizo: true,
    erro_integracao: true, webhook_recebido: false, falha_sincronizacao: true,
  })
  function toggle(key: keyof typeof prefs) { setPrefs(p => ({ ...p, [key]: !p[key] })) }

  return (
    <ConfigSubLayout title="Notificações" description="Configure quais notificações deseja receber">
      <ConfigSection title="Vendas e pedidos">
        <Toggle label="Nova venda" description="Receber notificação quando uma venda for concluída." enabled={prefs.nova_venda} onChange={() => toggle('nova_venda')} />
        <Toggle label="Novo pedido" description="Receber notificação quando um novo pedido chegar." enabled={prefs.novo_pedido} onChange={() => toggle('novo_pedido')} />
        <Toggle label="Pagamento confirmado" description="Receber notificação quando o pagamento for confirmado." enabled={prefs.pagamento} onChange={() => toggle('pagamento')} />
        <Toggle label="Pedido cancelado" description="Receber notificação quando um pedido for cancelado." enabled={prefs.pedido_cancelado} onChange={() => toggle('pedido_cancelado')} />
      </ConfigSection>

      <ConfigSection title="Estoque">
        <Toggle label="Estoque baixo" description="Alertar quando um produto atingir o estoque mínimo." enabled={prefs.estoque_baixo} onChange={() => toggle('estoque_baixo')} />
        <Toggle label="Produto sem estoque" description="Alertar quando um produto ficar sem estoque." enabled={prefs.sem_estoque} onChange={() => toggle('sem_estoque')} />
      </ConfigSection>

      <ConfigSection title="Financeiro">
        <Toggle label="Margem baixa" description="Alertar quando a margem de um produto estiver abaixo do mínimo." enabled={prefs.margem_baixa} onChange={() => toggle('margem_baixa')} />
        <Toggle label="Venda com prejuízo" description="Alertar quando uma venda resultar em prejuízo." enabled={prefs.venda_prejuizo} onChange={() => toggle('venda_prejuizo')} />
      </ConfigSection>

      <ConfigSection title="Integrações">
        <Toggle label="Erro de integração" description="Alertar quando houver erro de conexão com marketplace." enabled={prefs.erro_integracao} onChange={() => toggle('erro_integracao')} />
        <Toggle label="Webhook recebido" description="Notificar quando um webhook for recebido." enabled={prefs.webhook_recebido} onChange={() => toggle('webhook_recebido')} />
        <Toggle label="Falha de sincronização" description="Alertar quando a sincronização falhar." enabled={prefs.falha_sincronizacao} onChange={() => toggle('falha_sincronizacao')} />
      </ConfigSection>
    </ConfigSubLayout>
  )
}
