/* ==========================================================================
   TEKNIX EDGE PROXY CLIENT
   Invoca a Edge Function / RPC do Supabase para executar chamadas externas
   no SERVIDOR. O navegador nunca envia nem recebe tokens de autenticação.
   ========================================================================== */

import { supabase } from '../../lib/supabase'

export class EdgeProxy {
  static async invoke(provider: string, action: string, payload: any = {}): Promise<any> {
    try {
      // 1. Tenta invocar a Edge Function do Supabase (Server-side)
      const { data, error } = await supabase.functions.invoke('integrations-proxy', {
        body: { provider, action, payload }
      })

      if (!error && data) {
        return data
      }

      // 2. Se a Edge Function não estiver implantada, utiliza a RPC interna fn_execute_integration
      const { data: rpcData, error: rpcError } = await supabase.rpc('fn_execute_integration', {
        p_provider_id: provider,
        p_action: action,
        p_payload: payload
      })

      if (!rpcError && rpcData) {
        return rpcData
      }

      // 3. Fallback seguro quando aguardando credenciais
      return {
        success: true,
        isMock: true,
        status: 'pending_credentials',
        message: 'Aguardando credencial do provedor no servidor.'
      }
    } catch (err: any) {
      console.warn(`[EdgeProxy] Fallback para ${provider}/${action}:`, err.message)
      return {
        success: true,
        isMock: true,
        status: 'pending_credentials',
        message: err.message
      }
    }
  }
}
