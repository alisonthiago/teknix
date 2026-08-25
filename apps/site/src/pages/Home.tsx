import Hero from '../components/Hero'
import Categories from '../components/Categories'
import FeaturedProducts from '../components/FeaturedProducts'
import Experience from '../components/Experience'
import BestSellers from '../components/BestSellers'
import About from '../components/About'
import WhatsAppFloat from '../components/WhatsAppFloat'

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Experience />
      <BestSellers />
      <About />
      <WhatsAppFloat />
    </>
  )
}
