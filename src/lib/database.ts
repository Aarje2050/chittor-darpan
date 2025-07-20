// src/lib/database.ts - FIXED Service Aggregator
// Clean database service layer - imports and re-exports all services

// Import all existing services (keep these as they are)
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

import { 
  draftService,
  type BusinessDraftData,
  type BusinessDraft
} from './services/draft'

// FIXED: Import clean social services (we'll create these)
import { 
  socialService,
  type UserFollow,
  type BusinessFollow,
  type SocialStats,
  type FollowSuggestion
} from './services/social'

import { 
  messagingService,
  type Conversation,
  type Message,
  type MessageRequest,
  type ConversationFilters,
  type MessageFilters
} from './services/messaging'

import { 
  activityService,
  type UserActivity,
  type BusinessActivity,
  type ActivityFilters,
  type ActivityCreateData
} from './services/activity'

// Re-export all services
export {
  // Core business services (keep as is)
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
  draftService,
  
  // FIXED: Clean social services
  socialService,
  messagingService,
  activityService
}

// Re-export all types
export type {
  // Core business types (keep as is)
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
  
  // Draft types
  BusinessDraftData,
  BusinessDraft,
  
  // FIXED: Clean social types
  UserFollow,
  BusinessFollow,
  SocialStats,
  FollowSuggestion,
  
  // Messaging types
  Conversation,
  Message,
  MessageRequest,
  ConversationFilters,
  MessageFilters,
  
  // Activity types
  UserActivity,
  BusinessActivity,
  ActivityFilters,
  ActivityCreateData
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
  
  // Draft functionality
  draft: draftService,
  
  // FIXED: Social functionality
  social: socialService,
  messaging: messagingService,
  activity: activityService
}