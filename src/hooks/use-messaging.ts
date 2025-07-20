// src/hooks/use-messaging.ts - FIXED Hook
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { messagingService } from '@/lib/database' // FIXED: Use messagingService instead of messageService
import type { Conversation, Message } from '@/lib/database'

// Hook for getting unread message count
export function useUnreadCount() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()

  const updateCount = useCallback(async () => {
    if (!user) {
      setCount(0)
      return
    }

    try {
      const { data } = await messagingService.getUnreadCount(user.id) // FIXED: messagingService
      setCount(data || 0)
    } catch (err) {
      console.error('Error getting unread count:', err)
      setCount(0)
    }
  }, [user])

  useEffect(() => {
    updateCount()
    
    // Update count every 30 seconds
    const interval = setInterval(updateCount, 30000)
    return () => clearInterval(interval)
  }, [updateCount])

  return count
}

// Hook for managing conversations
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await messagingService.getUserConversations(user.id)
      
      if (error) {
        console.error('Error loading conversations:', error)
        setConversations([])
      } else {
        setConversations(data || [])
      }
    } catch (err) {
      console.error('Error in useConversations:', err)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return { conversations, loading, reload: loadConversations }
}

// Hook for managing messages in a conversation
export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await messagingService.getConversationMessages(conversationId)
      
      if (error) {
        console.error('Error loading messages:', error)
        setMessages([])
      } else {
        setMessages(data || [])
      }
    } catch (err) {
      console.error('Error in useMessages:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [conversationId, user])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !user || !content.trim()) {
      return { success: false, error: 'Invalid message' }
    }

    try {
      const { data, error } = await messagingService.sendMessage(
        conversationId,
        user.id,
        content.trim()
      )

      if (error) {
        console.error('Error sending message:', error)
        return { success: false, error }
      }

      // Add message to local state immediately
      if (data) {
        setMessages(prev => [...prev, { ...data, is_own_message: true }])
      }

      return { success: true, data }
    } catch (err) {
      console.error('Error in sendMessage:', err)
      return { success: false, error: err }
    }
  }, [conversationId, user])

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return

    try {
      await messagingService.markMessagesAsRead(conversationId, user.id)
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [conversationId, user])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return { 
    messages, 
    loading, 
    sendMessage, 
    markAsRead, 
    reload: loadMessages 
  }
}

// Hook for creating conversations
export function useCreateConversation() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const createConversation = useCallback(async (
    targetUserId: string, 
    businessId?: string,
    initialMessage?: string
  ) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      setLoading(true)
      
      // Create or get conversation
      const { data: conversationId, error: convError } = await messagingService.getOrCreateConversation(
        user.id,
        targetUserId,
        businessId
      )

      if (convError || !conversationId) {
        return { success: false, error: convError || 'Failed to create conversation' }
      }

      // Send initial message if provided
      if (initialMessage && initialMessage.trim()) {
        const { error: msgError } = await messagingService.sendMessage(
          conversationId,
          user.id,
          initialMessage.trim()
        )

        if (msgError) {
          console.error('Error sending initial message:', msgError)
          // Don't return error, conversation was created successfully
        }
      }

      return { success: true, conversationId }
    } catch (err) {
      console.error('Error creating conversation:', err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [user])

  return { createConversation, loading }
}