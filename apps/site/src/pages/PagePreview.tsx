import {useParams} from 'react-router-dom'
import PageRenderer from '../components/PageRenderer'
import WidgetPreview from './WidgetPreview'

export default function PagePreview() {
  const {id}=useParams()
  return window.parent===window ? <PageRenderer pageId={id!}/> : <WidgetPreview/>
}
