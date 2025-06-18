// src/lib/wordpress.ts
// WordPress REST API service for fetching blog data

import { 
    WordPressPost, 
    WordPressCategory,
    WordPressMedia,
    WordPressAuthor,
    BlogPost, 
    BlogCategory,
    BlogFilters,
    BlogResults,
    BlogPagination
  } from '@/types/wordpress'
  
  const WORDPRESS_API_URL = 'https://chittordarpan.com/wp-json/wp/v2'
  
  // WordPress API service
  export const wordpressService = {
    /**
     * Get blog posts with filters and pagination
     */
    async getPosts(filters: BlogFilters = {}): Promise<{ data: BlogResults | null; error: any }> {
      try {
        const params = new URLSearchParams()
        
        // Add filters to params
        if (filters.search) params.set('search', filters.search)
        if (filters.category) params.set('categories', filters.category)
        if (filters.tag) params.set('tags', filters.tag)
        if (filters.author) params.set('author', filters.author)
        
        // Pagination
        params.set('page', (filters.page || 1).toString())
        params.set('per_page', (filters.per_page || 10).toString())
        
        // Include embedded data (author, featured media, categories)
        params.set('_embed', 'true')
        
        // Only published posts
        params.set('status', 'publish')
        
        // Order by date (newest first)
        params.set('orderby', 'date')
        params.set('order', 'desc')
  
        const response = await fetch(`${WORDPRESS_API_URL}/posts?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
        }
  
        const posts: WordPressPost[] = await response.json()
        
        // Get pagination info from headers
        const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0')
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1')
        const currentPage = filters.page || 1
  
        // Process posts
        const processedPosts = posts.map(post => this.processPost(post))
  
        // Get categories for filtering
        const { data: categories } = await this.getCategories()
  
        const pagination: BlogPagination = {
          currentPage,
          totalPages,
          totalPosts,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
  
        const results: BlogResults = {
          posts: processedPosts,
          pagination,
          categories: categories || []
        }
  
        return { data: results, error: null }
  
      } catch (error) {
        console.error('Error fetching WordPress posts:', error)
        return { data: null, error }
      }
    },
  
    /**
     * Get a single post by slug
     */
    async getPostBySlug(slug: string): Promise<{ data: BlogPost | null; error: any }> {
      try {
        const params = new URLSearchParams()
        params.set('slug', slug)
        params.set('_embed', 'true')
        params.set('status', 'publish')
  
        const response = await fetch(`${WORDPRESS_API_URL}/posts?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
        }
  
        const posts: WordPressPost[] = await response.json()
        
        if (posts.length === 0) {
          return { data: null, error: 'Post not found' }
        }
  
        const processedPost = this.processPost(posts[0])
        return { data: processedPost, error: null }
  
      } catch (error) {
        console.error('Error fetching WordPress post by slug:', error)
        return { data: null, error }
      }
    },
  
    /**
     * Get categories
     */
    async getCategories(): Promise<{ data: BlogCategory[] | null; error: any }> {
      try {
        const params = new URLSearchParams()
        params.set('hide_empty', 'true') // Only categories with posts
        params.set('orderby', 'count')
        params.set('order', 'desc')
        params.set('per_page', '50') // Get up to 50 categories
  
        const response = await fetch(`${WORDPRESS_API_URL}/categories?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
        }
  
        const categories: WordPressCategory[] = await response.json()
        
        const processedCategories: BlogCategory[] = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          count: cat.count,
          parent: cat.parent
        }))
  
        return { data: processedCategories, error: null }
  
      } catch (error) {
        console.error('Error fetching WordPress categories:', error)
        return { data: null, error }
      }
    },
  
    /**
     * Get recent posts (for widgets, etc.)
     */
    async getRecentPosts(count: number = 5): Promise<{ data: BlogPost[] | null; error: any }> {
      try {
        const params = new URLSearchParams()
        params.set('per_page', count.toString())
        params.set('_embed', 'true')
        params.set('status', 'publish')
        params.set('orderby', 'date')
        params.set('order', 'desc')
  
        const response = await fetch(`${WORDPRESS_API_URL}/posts?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
        }
  
        const posts: WordPressPost[] = await response.json()
        const processedPosts = posts.map(post => this.processPost(post))
  
        return { data: processedPosts, error: null }
  
      } catch (error) {
        console.error('Error fetching recent WordPress posts:', error)
        return { data: null, error }
      }
    },
  
    /**
     * Search posts
     */
    async searchPosts(query: string, page: number = 1): Promise<{ data: BlogResults | null; error: any }> {
      return this.getPosts({
        search: query,
        page,
        per_page: 10
      })
    },
  
    /**
     * Get posts by category
     */
    async getPostsByCategory(categorySlug: string, page: number = 1): Promise<{ data: BlogResults | null; error: any }> {
      try {
        // First get category ID by slug
        const { data: categories } = await this.getCategories()
        const category = categories?.find(cat => cat.slug === categorySlug)
        
        if (!category) {
          return { data: null, error: 'Category not found' }
        }
  
        return this.getPosts({
          category: category.id.toString(),
          page,
          per_page: 10
        })
  
      } catch (error) {
        console.error('Error fetching posts by category:', error)
        return { data: null, error }
      }
    },
  
    /**
     * Process raw WordPress post into our BlogPost format
     */
    processPost(post: WordPressPost): BlogPost {
      // Extract embedded data
      const author = post._embedded?.author?.[0] || null
      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0] || null
      const terms = post._embedded?.['wp:term'] || []
      
      // Extract categories and tags
      const categories = terms[0]?.filter(term => term.taxonomy === 'category') || []
      const tags = terms[1]?.filter(term => term.taxonomy === 'post_tag') || []
  
      return {
        id: post.id,
        title: this.decodeHtml(post.title.rendered),
        slug: post.slug,
        content: post.content.rendered,
        excerpt: this.decodeHtml(post.excerpt.rendered),
        publishedAt: post.date,
        modifiedAt: post.modified,
        author: author ? {
          id: author.id,
          name: author.name,
          avatar: author.avatar_urls['96'] || author.avatar_urls['48'] || ''
        } : null,
        featuredImage: featuredMedia ? {
          id: featuredMedia.id,
          url: featuredMedia.source_url,
          alt: featuredMedia.alt_text || '',
          width: featuredMedia.media_details?.width || 0,
          height: featuredMedia.media_details?.height || 0
        } : null,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        })),
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug
        })),
        isSticky: post.sticky
      }
    },
  
    /**
     * Decode HTML entities in WordPress content
     */
    decodeHtml(html: string): string {
      const txt = document.createElement('textarea')
      txt.innerHTML = html
      return txt.value
    },
  
    /**
     * Format date for display
     */
    formatDate(dateString: string): string {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
  
    /**
     * Get reading time estimate
     */
    getReadingTime(content: string): number {
      const wordsPerMinute = 200
      const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
      const minutes = Math.ceil(words / wordsPerMinute)
      return Math.max(1, minutes) // Minimum 1 minute
    },
  
    /**
     * Clean excerpt for display
     */
    cleanExcerpt(excerpt: string, maxLength: number = 160): string {
      // Remove HTML tags
      const cleaned = excerpt.replace(/<[^>]*>/g, '')
      
      // Trim to max length
      if (cleaned.length <= maxLength) {
        return cleaned
      }
      
      return cleaned.substring(0, maxLength).trim() + '...'
    },
  
    /**
     * Generate SEO-friendly URL
     */
    getPostUrl(slug: string): string {
      return `/blog/${slug}`
    },
  
    /**
     * Get category URL
     */
    getCategoryUrl(slug: string): string {
      return `/blog/category/${slug}`
    }
  }
  
  // Export default
  export default wordpressService