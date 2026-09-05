import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageRenderer from '../components/PageRenderer'
import { getHubOrigin, isAllowedHubOrigin } from '../../../../packages/core/src/pageWidgets'

export default function WidgetPreview() {
  const { id } = useParams()
  const [tree, setTree] = useState<any>(null)
  useEffect(() => {
    const origin = getHubOrigin(import.meta.env.VITE_HUB_URL)
    if (window.parent === window) return
    const receive = (event: MessageEvent) => {
      if (isAllowedHubOrigin(event.origin) && event.source === window.parent && event.data?.type === 'teknix:preview-tree' && event.data?.scope === `page:${id}` && event.data.tree?.page?.id === id) setTree(event.data.tree)
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ type: 'teknix:preview-ready', scope: `page:${id}` }, origin || '*')
    return () => window.removeEventListener('message', receive)
  }, [id])
  return tree ? <PageRenderer pageId={id!} previewData={tree} disablePageHeaderFooter /> : <p style={{ padding: 32 }}>Aguardando a página do HUB…</p>
}
