// src/app/blog/[slug]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { wordpressService } from '@/lib/wordpress'
import { type BlogPost } from '@/types/wordpress'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

export default function BlogPostPage() {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug)
    }
  }, [slug])

  const loadBlogPost = async (postSlug: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load the main post
      const { data: postData, error: postError } = await wordpressService.getPostBySlug(postSlug)

      if (postError) {
        throw new Error('Failed to load blog post')
      }

      if (!postData) {
        setError('Blog post not found')
        return
      }

      setPost(postData)

      // Load related posts (recent posts for now)
      const { data: recentData } = await wordpressService.getRecentPosts(4)
      if (recentData) {
        // Filter out current post
        const related = recentData.filter(p => p.id !== postData.id).slice(0, 3)
        setRelatedPosts(related)
      }

    } catch (err) {
      console.error('Error loading blog post:', err)
      setError('Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  const handleRelatedPostClick = (relatedSlug: string) => {
    router.push(`/blog/${relatedSlug}`)
  }

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/blog?category=${categorySlug}`)
  }

  const handleShareClick = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: wordpressService.cleanExcerpt(post.excerpt, 100),
        url: window.location.href,
      }).catch(console.error)
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return <BlogPostSkeleton />
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {error === 'Blog post not found' ? 'Post Not Found' : 'Error Loading Post'}
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/blog')} className="w-full">
                Back to Blog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPageTitle = () => `${post.title} - Blog - Chittor Darpan`
  const getPageDescription = () => wordpressService.cleanExcerpt(post.excerpt, 160)

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/blog/${post.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://chittordarpan.com/blog/${post.slug}`} />
        {post.featuredImage && (
          <meta property="og:image" content={post.featuredImage.url} />
        )}
        
        {/* Article specific */}
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={post.modifiedAt} />
        {post.author && (
          <meta property="article:author" content={post.author.name} />
        )}
        {post.categories.map(category => (
          <meta key={category.id} property="article:section" content={category.name} />
        ))}
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="Blog Post"
          showBackButton
          onBackClick={() => router.push('/blog')}
        />
        
        <div className="px-4 py-6">
          <MobileBlogPostContent 
            post={post}
            relatedPosts={relatedPosts}
            onCategoryClick={handleCategoryClick}
            onRelatedPostClick={handleRelatedPostClick}
            onShareClick={handleShareClick}
            formatDate={formatDate}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DesktopBlogPostLayout
          post={post}
          relatedPosts={relatedPosts}
          onCategoryClick={handleCategoryClick}
          onRelatedPostClick={handleRelatedPostClick}
          onShareClick={handleShareClick}
          formatDate={formatDate}
        />
      </div>
    </>
  )
}

// Mobile Content Component
interface BlogPostContentProps {
  post: BlogPost
  relatedPosts: BlogPost[]
  onCategoryClick: (slug: string) => void
  onRelatedPostClick: (slug: string) => void
  onShareClick: () => void
  formatDate: (date: string) => string
}

function MobileBlogPostContent({
  post,
  relatedPosts,
  onCategoryClick,
  onRelatedPostClick,
  onShareClick,
  formatDate
}: BlogPostContentProps) {
  return (
    <div className="space-y-6">
      {/* Post Header */}
      <Card>
        <CardContent className="p-6">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-6">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => onCategoryClick(category.slug)}
                  className="text-xs"
                >
                  <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">
                    {category.name}
                  </Badge>
                </button>
              ))}
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          {/* Meta */}
          <div className="flex flex-col gap-3 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{wordpressService.getReadingTime(post.content)} min read</span>
              </div>
            </div>
            
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>By {post.author.name}</span>
              </div>
            )}
          </div>
          
          {/* Share Button */}
          <Button 
            onClick={onShareClick}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Post
          </Button>
        </CardContent>
      </Card>

      {/* Post Content */}
      <Card>
        <CardContent className="p-6">
          <div 
            className="prose prose-gray max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      {post.tags.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Related Posts</h3>
            <div className="space-y-4">
              {relatedPosts.map(relatedPost => (
                <div
                  key={relatedPost.id}
                  onClick={() => onRelatedPostClick(relatedPost.slug)}
                  className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {relatedPost.featuredImage && (
                    <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={relatedPost.featuredImage.url}
                        alt={relatedPost.featuredImage.alt || relatedPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(relatedPost.publishedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => window.location.href = '/blog'}
              variant="outline" 
              className="w-full mt-4"
            >
              View All Posts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Desktop Layout Component
function DesktopBlogPostLayout({
  post,
  relatedPosts,
  onCategoryClick,
  onRelatedPostClick,
  onShareClick,
  formatDate
}: BlogPostContentProps) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Desktop Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <article className="space-y-8">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt || post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Post Header */}
            <div>
              {/* Categories */}
              {post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => onCategoryClick(category.slug)}
                    >
                      <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">
                        {category.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              
              <h1 className="text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>
              
              {/* Meta */}
              <div className="flex items-center gap-6 text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                
                {post.author && (
                  <div className="flex items-center gap-2">
                    {post.author.avatar && (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>By {post.author.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{wordpressService.getReadingTime(post.content)} min read</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div 
              className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary">
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </article>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Share */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Share This Post</h3>
                <Button 
                  onClick={onShareClick}
                  variant="outline" 
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share Post
                </Button>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Related Posts</h3>
                  <div className="space-y-4">
                    {relatedPosts.map(relatedPost => (
                      <div
                        key={relatedPost.id}
                        onClick={() => onRelatedPostClick(relatedPost.slug)}
                        className="block p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {relatedPost.featuredImage && (
                          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3">
                            <img
                              src={relatedPost.featuredImage.url}
                              alt={relatedPost.featuredImage.alt || relatedPost.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(relatedPost.publishedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/blog'}
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    View All Posts
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton
function BlogPostSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="space-y-6">
          {/* Image skeleton */}
          <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          
          {/* Title skeleton */}
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}