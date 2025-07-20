// src/lib/services/messaging.ts - Clean Messaging Service
import { supabase } from '../supabase'

// Types for messaging services
export interface Conversation {
  id: string
  type: 'user_user' | 'user_business'
  participant_1: string
  participant_2: string | null
  business_id: string | null
  last_message_at: string
  is_archived: boolean
  created_at: string
  updated_at: string
  // Related data
  other_user_name?: string
  other_user_avatar?: string
  business_name?: string
  business_logo?: string
  last_message?: Message | null
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file'
  is_read: boolean
  read_at: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  // Related data
  sender_name?: string
  sender_avatar?: string
  is_own_message?: boolean
}

export interface MessageRequest {
  id: string
  conversation_id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  message_preview: string | null
  created_at: string
  updated_at: string
  // Related data
  from_user_name?: string
  from_user_avatar?: string
  conversation?: Conversation
}

export interface ConversationFilters {
  userId: string
  search?: string
  limit?: number
  includeArchived?: boolean
}

export interface MessageFilters {
  conversationId: string
  limit?: number
  before?: string
}

// Messaging Service
export const messagingService = {
  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, limit: number = 20): Promise<{ data: Conversation[] | null; error: any }> {
    try {
      console.log('💬 Loading conversations for user:', userId)

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:participant_1(full_name, avatar_url),
          participant2:participant_2(full_name, avatar_url),
          business:business_id(name, logo_url)
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error loading conversations:', error)
        return { data: null, error }
      }

      // Get last message and unread count for each conversation
      const conversationsWithData = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:sender_id(full_name, avatar_url)
            `)
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', userId)

          // Determine other participant info
          let otherUserName = null
          let otherUserAvatar = null
          let businessName = null
          let businessLogo = null

          if (conv.type === 'user_business') {
            businessName = conv.business?.name || 'Business'
            businessLogo = conv.business?.logo_url || null
            // Other participant is the user
            if (conv.participant_1 === userId) {
              otherUserName = conv.participant2?.full_name || 'User'
              otherUserAvatar = conv.participant2?.avatar_url || null
            } else {
              otherUserName = conv.participant1?.full_name || 'User'
              otherUserAvatar = conv.participant1?.avatar_url || null
            }
          } else {
            // user_user conversation
            if (conv.participant_1 === userId) {
              otherUserName = conv.participant2?.full_name || 'User'
              otherUserAvatar = conv.participant2?.avatar_url || null
            } else {
              otherUserName = conv.participant1?.full_name || 'User'
              otherUserAvatar = conv.participant1?.avatar_url || null
            }
          }

          return {
            ...conv,
            other_user_name: otherUserName,
            other_user_avatar: otherUserAvatar,
            business_name: businessName,
            business_logo: businessLogo,
            last_message: lastMessage ? {
              ...lastMessage,
              sender_name: lastMessage.sender?.full_name || 'User',
              sender_avatar: lastMessage.sender?.avatar_url || null,
              is_own_message: lastMessage.sender_id === userId
            } : null,
            unread_count: unreadCount || 0
          }
        })
      )

      console.log(`✅ Loaded ${conversationsWithData.length} conversations`)
      return { data: conversationsWithData, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserConversations:', error)
      return { data: null, error }
    }
  },

  /**
   * Get or create conversation between users
   */
  async getOrCreateConversation(
    user1Id: string, 
    user2Id: string, 
    businessId?: string
  ): Promise<{ data: string | null; error: any }> {
    try {
      console.log('💬 Getting/creating conversation between:', user1Id, user2Id, businessId)

      // Try to find existing conversation
      let query = supabase
        .from('conversations')
        .select('id')

      if (businessId) {
        query = query
          .eq('business_id', businessId)
          .or(`participant_1.eq.${user1Id},participant_2.eq.${user1Id}`)
      } else {
        query = query
          .is('business_id', null)
          .or(`and(participant_1.eq.${user1Id},participant_2.eq.${user2Id}),and(participant_1.eq.${user2Id},participant_2.eq.${user1Id})`)
      }

      const { data: existing } = await query.maybeSingle()

      if (existing) {
        return { data: existing.id, error: null }
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert([
          {
            type: businessId ? 'user_business' : 'user_user',
            participant_1: user1Id,
            participant_2: user2Id,
            business_id: businessId || null
          }
        ])
        .select('id')
        .single()

      if (error) {
        console.error('❌ Error creating conversation:', error)
        return { data: null, error }
      }

      console.log('✅ Conversation created:', newConv.id)
      return { data: newConv.id, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getOrCreateConversation:', error)
      return { data: null, error }
    }
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string, limit: number = 50): Promise<{ data: Message[] | null; error: any }> {
    try {
      console.log('📨 Loading messages for conversation:', conversationId)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error loading messages:', error)
        return { data: null, error }
      }

      const messages = (data || []).map(msg => ({
        ...msg,
        sender_name: msg.sender?.full_name || 'User',
        sender_avatar: msg.sender?.avatar_url || null
      })).reverse() // Show oldest first in UI

      console.log(`✅ Loaded ${messages.length} messages`)
      return { data: messages, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getConversationMessages:', error)
      return { data: null, error }
    }
  },

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<{ data: Message | null; error: any }> {
    try {
      console.log('📤 Sending message to conversation:', conversationId)

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
            message_type: messageType
          }
        ])
        .select(`
          *,
          sender:sender_id(full_name, avatar_url)
        `)
        .single()

      if (error) {
        console.error('❌ Error sending message:', error)
        return { data: null, error }
      }

      const message: Message = {
        ...data,
        sender_name: data.sender?.full_name || 'User',
        sender_avatar: data.sender?.avatar_url || null,
        is_own_message: true
      }

      console.log('✅ Message sent successfully')
      return { data: message, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in sendMessage:', error)
      return { data: null, error }
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('👁️ Marking messages as read in conversation:', conversationId)

      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('❌ Error marking messages as read:', error)
        return { success: false, error }
      }

      console.log('✅ Messages marked as read')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in markMessagesAsRead:', error)
      return { success: false, error }
    }
  },

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<{ data: number; error: any }> {
    try {
      // Get all conversations for user
      const { data: conversations, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)

      if (conversationError) {
        console.error('❌ Error fetching conversations:', conversationError)
        return { data: 0, error: conversationError }
      }

      const conversationIds = conversations?.map(c => c.id) || []

      if (conversationIds.length === 0) {
        return { data: 0, error: null }
      }

      // Get unread message count
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)
        .in('conversation_id', conversationIds)

      if (error) {
        console.error('❌ Error getting unread count:', error)
        return { data: 0, error }
      }

      return { data: count || 0, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUnreadCount:', error)
      return { data: 0, error }
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🗑️ Deleting message:', messageId)

      const { error } = await supabase
        .from('messages')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId)

      if (error) {
        console.error('❌ Error deleting message:', error)
        return { success: false, error }
      }

      console.log('✅ Message deleted')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in deleteMessage:', error)
      return { success: false, error }
    }
  },

  /**
   * Archive/unarchive conversation
   */
  async archiveConversation(conversationId: string, isArchived: boolean): Promise<{ success: boolean; error: any }> {
    try {
      console.log('📁 Archiving conversation:', conversationId, isArchived)

      const { error } = await supabase
        .from('conversations')
        .update({ 
          is_archived: isArchived,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) {
        console.error('❌ Error archiving conversation:', error)
        return { success: false, error }
      }

      console.log('✅ Conversation archived')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in archiveConversation:', error)
      return { success: false, error }
    }
  },

  /**
   * Start conversation with business
   */
  async startBusinessConversation(userId: string, businessId: string, initialMessage: string): Promise<{ data: string | null; error: any }> {
    try {
      console.log('🏢 Starting business conversation:', businessId)

      // Get business owner
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      if (businessError || !business) {
        return { data: null, error: 'Business not found' }
      }

      // Create conversation
      const { data: conversationId, error: convError } = await this.getOrCreateConversation(
        userId,
        business.owner_id,
        businessId
      )

      if (convError || !conversationId) {
        return { data: null, error: convError || 'Failed to create conversation' }
      }

      // Send initial message
      const { error: messageError } = await this.sendMessage(
        conversationId,
        userId,
        initialMessage
      )

      if (messageError) {
        return { data: null, error: messageError }
      }

      console.log('✅ Business conversation started')
      return { data: conversationId, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in startBusinessConversation:', error)
      return { data: null, error }
    }
  }
}