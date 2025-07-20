// src/components/messaging/messages-interface.tsx - FIXED with URL Parameter Support
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageCircle, Send, User, Users, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useMessages, useConversations } from '@/hooks/use-messaging'

// Message Bubble Component
function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex items-end max-w-[80%] gap-2">
        {!isOwn && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <img 
              src={message.sender_avatar || '/default-avatar.png'} 
              alt={message.sender_name}
              className="w-full h-full object-cover"
            />
          </Avatar>
        )}
        
        <div className={`px-4 py-3 rounded-2xl ${
          isOwn 
            ? 'bg-blue-500 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Message Input Component
function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  const handleSend = async () => {
    if (!message.trim() || disabled) return
    
    const result = await onSend(message.trim())
    if (result && result.success) {
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 rounded-full border-gray-300 focus:border-blue-500"
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Conversation List Item
function ConversationItem({ conversation, onClick, isActive }) {
  const lastMessage = conversation.last_message
  const displayName = conversation.business_name || conversation.other_user_name || 'Unknown'
  const avatar = conversation.business_logo || conversation.other_user_avatar
  const unreadCount = conversation.unread_count || 0

  return (
    <div 
      onClick={() => onClick(conversation)}
      className={`flex items-center p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <Avatar className="w-12 h-12 flex-shrink-0">
        <img 
          src={avatar || '/default-avatar.png'} 
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </Avatar>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">{displayName}</h3>
          {lastMessage && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {new Date(lastMessage.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-600 truncate">
            {lastMessage ? (
              <>
                {lastMessage.is_own_message && <span className="text-gray-400">You: </span>}
                {lastMessage.content}
              </>
            ) : (
              <span className="text-gray-400">No messages yet</span>
            )}
          </p>
          
          {unreadCount > 0 && (
            <Badge className="bg-blue-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Chat Header
function ChatHeader({ conversation, onBack }) {
  if (!conversation) return null

  const displayName = conversation.business_name || conversation.other_user_name || 'Unknown'
  const avatar = conversation.business_logo || conversation.other_user_avatar

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-2 p-2 lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <Avatar className="w-10 h-10">
          <img 
            src={avatar || '/default-avatar.png'} 
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </Avatar>
        
        <div className="ml-3">
          <h2 className="font-semibold text-gray-900">{displayName}</h2>
          <p className="text-sm text-gray-500">
            {conversation.type === 'user_business' ? 'Business' : 'Online'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="p-2">
          <Phone className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="p-2">
          <Video className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="p-2">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Messages List
function MessagesList({ conversationId, onBack }) {
  const { messages, loading, sendMessage, markAsRead } = useMessages(conversationId)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId) {
      markAsRead()
    }
  }, [conversationId, markAsRead])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.is_own_message}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput onSend={sendMessage} disabled={loading} />
    </div>
  )
}

// Main Messages Component - UPDATED with URL parameter support
export default function MessagesInterface() {
  const { conversations, loading } = useConversations()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const searchParams = useSearchParams()

  // NEW: Handle URL parameter for direct conversation opening
  useEffect(() => {
    const conversationParam = searchParams.get('conversation')
    if (conversationParam && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationParam)
      if (conversation) {
        setSelectedConversation(conversation)
        setShowMobileChat(true)
      }
    }
  }, [searchParams, conversations])

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation)
    setShowMobileChat(true)
  }

  const handleBackToList = () => {
    setShowMobileChat(false)
    setSelectedConversation(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Conversations List */}
      <div className={`${
        showMobileChat ? 'hidden' : 'flex'
      } lg:flex flex-col w-full lg:w-80 border-r border-gray-200`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Messages
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400">Start messaging with businesses and users!</p>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={handleConversationSelect}
                isActive={selectedConversation?.id === conversation.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${
        showMobileChat ? 'flex' : 'hidden lg:flex'
      } flex-col flex-1`}>
        {selectedConversation ? (
          <>
            <ChatHeader 
              conversation={selectedConversation} 
              onBack={handleBackToList}
            />
            <MessagesList 
              conversationId={selectedConversation.id}
              onBack={handleBackToList}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to Messages
              </h2>
              <p className="text-gray-500">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}