// src/lib/services/draft.ts - Business Draft Management Service
import { supabase } from '../supabase'

// Types for draft functionality
export interface BusinessDraftData {
  // Basic Info
  name: string
  description: string
  category_ids: string[]
  
  // Images
  logo_url: string
  cover_image_url: string
  gallery_images: string[]
  
  // Location
  city_id: string
  area_id: string
  address: string
  
  // Contact
  phone: string[]
  email: string
  website: string
  whatsapp: string
  facebook_url: string
  instagram_url: string
  
  // Form state
  current_step: number
}

export interface BusinessDraft {
  id: string
  user_id: string
  form_data: BusinessDraftData
  current_step: number
  created_at: string
  updated_at: string
}

export const draftService = {
  // Save or update draft for user
  async saveDraft(userId: string, formData: Partial<BusinessDraftData>, currentStep: number = 1) {
    try {
      console.log('💾 Saving draft for user:', userId)
      
      const draftData = {
        user_id: userId,
        form_data: formData,
        current_step: currentStep,
        updated_at: new Date().toISOString()
      }

      // Check if draft exists
      const { data: existingDraft } = await supabase
        .from('business_drafts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingDraft) {
        // Update existing draft
        const { data, error } = await supabase
          .from('business_drafts')
          .update(draftData)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        console.log('✅ Draft updated successfully')
        return { data, error: null }
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('business_drafts')
          .insert([draftData])
          .select()
          .single()
        
        if (error) throw error
        console.log('✅ Draft created successfully')
        return { data, error: null }
      }
    } catch (error) {
      // Only log actual errors, not expected race conditions
      if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        console.error('❌ Error saving draft:', error)
      }
      return { data: null, error }
    }
  },

  // Load draft for user
  async loadDraft(userId: string) {
    try {
      console.log('🔍 Loading draft for user:', userId)
      
      const { data, error } = await supabase
        .from('business_drafts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        console.log('✅ Draft loaded successfully')
        return { data: data as BusinessDraft, error: null }
      } else {
        console.log('📝 No draft found')
        return { data: null, error: null }
      }
    } catch (error) {
      console.error('❌ Error loading draft:', error)
      return { data: null, error }
    }
  },

  // Delete draft after successful business creation
  async deleteDraft(userId: string) {
    try {
      console.log('🗑️ Deleting draft for user:', userId)
      
      const { error } = await supabase
        .from('business_drafts')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      
      console.log('✅ Draft deleted successfully')
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Error deleting draft:', error)
      return { success: false, error }
    }
  },

  // Check if user has a draft
  async hasDraft(userId: string) {
    try {
      const { data, error } = await supabase
        .from('business_drafts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return { hasDraft: !!data, error: null }
    } catch (error) {
      console.error('❌ Error checking draft:', error)
      return { hasDraft: false, error }
    }
  },

  // Get draft metadata (for dashboard preview)
  async getDraftSummary(userId: string) {
    try {
      const { data, error } = await supabase
        .from('business_drafts')
        .select('form_data, current_step, updated_at')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        const formData = data.form_data as BusinessDraftData
        return {
          data: {
            businessName: formData.name || 'Untitled Business',
            currentStep: data.current_step,
            lastUpdated: data.updated_at,
            completionPercentage: Math.round((data.current_step / 4) * 100)
          },
          error: null
        }
      }
      
      return { data: null, error: null }
    } catch (error) {
      console.error('❌ Error getting draft summary:', error)
      return { data: null, error }
    }
  }
}