// src/lib/database.ts - Clean Service Aggregator
// Professional database service layer - imports and re-exports all services

// Import all services
import { 
  businessService,
  type Business,
  type BusinessFilters,
  type BusinessCounts,
  type BusinessOwnerStats,
  type BusinessFormData
} from './services/business'

import { 
  locationService,
  type City,
  type Area
} from './services/location'

import { 
  categoryService,
  type Category,
  type CategoryWithStats
} from './services/category'

import { 
  businessOwnerService,
  type UserBusiness,
  type BusinessOwnerPermissions
} from './services/business-owner'

import { 
  userService,
  type UserProfile,
  type UserStats,
  type UserActivityItem,
  type ProfileUpdateData
} from './services/user'

import { 
  reviewService,
  type Review,
  type ReviewReply,
  type ReviewFormData,
  type ReviewStats
} from './services/reviews'

import { 
  tourismService,
  tourismImageService,
  tourismReviewService,
  type TourismPlace,
  type TourismFormData,
  type TourismCounts,
  type TourismImage,
  type TourismReview,
  type TourismReviewImage,
  type TourismReviewFormData
} from './services/tourism'

import { 
  collectionsService,
  type UserCollection,
  type SavedItem,
  type CollectionFormData,
  type SaveItemData,
  type CollectionWithItems,
  type CollectionStats
} from './services/collections'

// NEW: Import draft service
import { 
  draftService,
  type BusinessDraftData,
  type BusinessDraft
} from './services/draft'

// Re-export all services
export {
  businessService,
  locationService,
  categoryService,
  businessOwnerService,
  userService,
  reviewService,
  tourismService,
  tourismImageService,
  tourismReviewService,
  collectionsService,
  draftService // NEW: Export draft service
}

// Re-export all types
export type {
  // Business types
  Business,
  BusinessFilters,
  BusinessCounts,
  BusinessOwnerStats,
  BusinessFormData,
  
  // Location types
  City,
  Area,
  
  // Category types
  Category,
  CategoryWithStats,
  
  // Business Owner types
  UserBusiness,
  BusinessOwnerPermissions,
  
  // User types
  UserProfile,
  UserStats,
  UserActivityItem,
  ProfileUpdateData,
  
  // Review types
  Review,
  ReviewReply,
  ReviewFormData,
  ReviewStats,
  
  // Tourism types
  TourismPlace,
  TourismFormData,
  TourismCounts,
  TourismImage,
  TourismReview,
  TourismReviewImage,
  TourismReviewFormData,
  
  // Collections types
  UserCollection,
  SavedItem,
  CollectionFormData,
  SaveItemData,
  CollectionWithItems,
  CollectionStats,
  
  // NEW: Draft types
  BusinessDraftData,
  BusinessDraft
}

// Default export for convenience - grouped by domain
export default {
  // Core business functionality
  business: businessService,
  location: locationService,
  category: categoryService,
  businessOwner: businessOwnerService,
  
  // User and content
  user: userService,
  review: reviewService,
  collections: collectionsService,
  
  // Tourism functionality
  tourism: tourismService,
  tourismImage: tourismImageService,
  tourismReview: tourismReviewService,
  
  // NEW: Draft functionality
  draft: draftService
}