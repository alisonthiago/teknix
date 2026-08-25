import { supabase } from './supabase'

export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')

  try {
    // Test basic connection
    const { error: healthError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true })

    if (healthError) {
      console.error('Connection error:', healthError.message)
      return { success: false, error: healthError.message }
    }

    console.log('Connection successful!')

    // Try to list products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5)

    if (productsError) {
      console.error('Products query error:', productsError.message)
    } else {
      console.log('Products found:', products?.length || 0)
      if (products && products.length > 0) {
        console.log('Sample product fields:', Object.keys(products[0]))
      }
    }

    // Try to list categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)

    if (categoriesError) {
      console.error('Categories query error:', categoriesError.message)
    } else {
      console.log('Categories found:', categories?.length || 0)
    }

    return { success: true, products, categories }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Unexpected error' }
  }
}
