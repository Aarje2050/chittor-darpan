// src/types/wordpress.ts
// WordPress REST API response types

export interface WordPressPost {
    id: number
    date: string
    date_gmt: string
    guid: {
      rendered: string
    }
    modified: string
    modified_gmt: string
    slug: string
    status: 'publish' | 'future' | 'draft' | 'pending' | 'private'
    type: string
    link: string
    title: {
      rendered: string
    }
    content: {
      rendered: string
      protected: boolean
    }
    excerpt: {
      rendered: string
      protected: boolean
    }
    author: number
    featured_media: number
    comment_status: 'open' | 'closed'
    ping_status: 'open' | 'closed'
    sticky: boolean
    template: string
    format: string
    meta: Record<string, any>
    categories: number[]
    tags: number[]
    // Additional fields when using _embed
    _embedded?: {
      author?: WordPressAuthor[]
      'wp:featuredmedia'?: WordPressMedia[]
      'wp:term'?: WordPressTerm[][]
    }
  }
  
  export interface WordPressAuthor {
    id: number
    name: string
    url: string
    description: string
    link: string
    slug: string
    avatar_urls: {
      24: string
      48: string
      96: string
    }
  }
  
  export interface WordPressMedia {
    id: number
    date: string
    slug: string
    type: 'attachment'
    link: string
    title: {
      rendered: string
    }
    author: number
    comment_status: 'open' | 'closed'
    ping_status: 'open' | 'closed'
    template: string
    meta: Record<string, any>
    description: {
      rendered: string
    }
    caption: {
      rendered: string
    }
    alt_text: string
    media_type: 'image' | 'file'
    mime_type: string
    media_details: {
      width: number
      height: number
      file: string
      filesize: number
      sizes: {
        [key: string]: {
          file: string
          width: number
          height: number
          mime_type: string
          source_url: string
        }
      }
    }
    source_url: string
  }
  
  export interface WordPressTerm {
    id: number
    count: number
    description: string
    link: string
    name: string
    slug: string
    taxonomy: 'category' | 'post_tag'
    parent: number
  }
  
  export interface WordPressCategory extends WordPressTerm {
    taxonomy: 'category'
  }
  
  export interface WordPressTag extends WordPressTerm {
    taxonomy: 'post_tag'
  }
  
  // Processed types for our app
  export interface BlogPost {
    id: number
    title: string
    slug: string
    content: string
    excerpt: string
    publishedAt: string
    modifiedAt: string
    author: {
      id: number
      name: string
      avatar: string
    } | null
    featuredImage: {
      id: number
      url: string
      alt: string
      width: number
      height: number
    } | null
    categories: {
      id: number
      name: string
      slug: string
    }[]
    tags: {
      id: number
      name: string
      slug: string
    }[]
    isSticky: boolean
  }
  
  export interface BlogCategory {
    id: number
    name: string
    slug: string
    description: string
    count: number
    parent: number
  }
  
  export interface BlogFilters {
    search?: string
    category?: string
    tag?: string
    author?: string
    page?: number
    per_page?: number
  }
  
  export interface BlogPagination {
    currentPage: number
    totalPages: number
    totalPosts: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  
  export interface BlogResults {
    posts: BlogPost[]
    pagination: BlogPagination
    categories: BlogCategory[]
  }