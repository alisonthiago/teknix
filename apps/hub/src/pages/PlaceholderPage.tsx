import './PlaceholderPage.css'

interface PlaceholderPageProps {
  title: string
  description?: string
  icon?: string
}

export default function PlaceholderPage({ title, description, icon = '🚧' }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description || 'Esta página está em desenvolvimento.'}</p>
    </div>
  )
}
