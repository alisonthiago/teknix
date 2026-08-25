import { createClient } from '@/utils/supabase/server'
import SimulatorClient from './SimulatorClient'

export default async function PricingSimulatorPage() {
  const supabase = await createClient()
  
  // Fetch data needed for the simulator
  const { data: products } = await supabase.from('products').select('*').order('name')
  const { data: marketplaces } = await supabase.from('marketplaces').select('*').order('name')

  return (
    <div className="mp-stack">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulador de Preço e Margem</h2>
          <p className="text-[#999]">Calcule lucros, teste preços e descubra o preço sugerido.</p>
        </div>
      </div>
      
      <SimulatorClient 
        products={products || []} 
        marketplaces={marketplaces || []} 
      />
    </div>
  )
}
