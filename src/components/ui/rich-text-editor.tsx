// src/components/ui/rich-text-editor.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Type, RotateCcw } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string, plainText: string) => void
  placeholder?: string
  error?: boolean
  maxLength?: number
  minLength?: number
  className?: string
}

interface FormattingButton {
  icon: React.ReactNode
  label: string
  action: () => void
  active?: boolean
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  error = false,
  maxLength = 1000,
  minLength = 50,
  className = ""
}: RichTextEditorProps) {
  const [content, setContent] = useState(value)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  // Update content when value changes externally
  useEffect(() => {
    setContent(value)
  }, [value])

  // Get plain text for validation
  const getPlainText = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/^[\s]*[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^[\s]*\d+\.\s+/gm, '') // Remove numbered lists
      .trim()
  }

  // Apply formatting to selected text
  const applyFormatting = (formatType: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    if (selectedText.length === 0) return

    let formattedText = ''
    let newContent = ''

    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'bullet':
        // Add bullet points to each line
        const bulletLines = selectedText.split('\n').map(line => line.trim() ? `• ${line.trim()}` : line).join('\n')
        formattedText = bulletLines
        break
      case 'number':
        // Add numbers to each line
        const numberLines = selectedText.split('\n').map((line, index) => 
          line.trim() ? `${index + 1}. ${line.trim()}` : line
        ).join('\n')
        formattedText = numberLines
        break
      default:
        formattedText = selectedText
    }

    newContent = content.substring(0, start) + formattedText + content.substring(end)
    
    // Update content
    setContent(newContent)
    const plainText = getPlainText(newContent)
    onChange(newContent, plainText)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + formattedText.length)
    }, 0)
  }

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    
    // Security: Remove potential harmful content
    const sanitized = newContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript
    
    if (sanitized.length <= maxLength) {
      setContent(sanitized)
      const plainText = getPlainText(sanitized)
      onChange(sanitized, plainText)
    }
  }

  // Update selection state
  const handleSelectionChange = () => {
    if (!textareaRef.current) return
    
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    setSelection({ start, end })
    
    // Check active formats
    const selectedText = content.substring(start, end)
    const newActiveFormats = new Set<string>()
    
    if (selectedText.includes('**')) newActiveFormats.add('bold')
    if (selectedText.match(/\*[^*]+\*/)) newActiveFormats.add('italic')
    if (selectedText.includes('•')) newActiveFormats.add('bullet')
    if (selectedText.match(/^\d+\./m)) newActiveFormats.add('number')
    
    setActiveFormats(newActiveFormats)
  }

  // Clear all formatting
  const clearFormatting = () => {
    const plainText = getPlainText(content)
    setContent(plainText)
    onChange(plainText, plainText)
  }

  // Formatting buttons
  const formattingButtons: FormattingButton[] = [
    {
      icon: <Bold className="w-4 h-4" />,
      label: 'Bold',
      action: () => applyFormatting('bold'),
      active: activeFormats.has('bold')
    },
    {
      icon: <Italic className="w-4 h-4" />,
      label: 'Italic', 
      action: () => applyFormatting('italic'),
      active: activeFormats.has('italic')
    },
    {
      icon: <List className="w-4 h-4" />,
      label: 'Bullet List',
      action: () => applyFormatting('bullet'),
      active: activeFormats.has('bullet')
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      label: 'Numbered List',
      action: () => applyFormatting('number'),
      active: activeFormats.has('number')
    },
    {
      icon: <RotateCcw className="w-4 h-4" />,
      label: 'Clear Formatting',
      action: clearFormatting
    }
  ]

  const plainText = getPlainText(content)
  const isValidLength = plainText.length >= minLength

  return (
    <div className={`border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        {formattingButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action}
            disabled={selection.start === selection.end && button.label !== 'Clear Formatting'}
            className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              button.active ? 'bg-gray-300' : ''
            }`}
            title={button.label}
          >
            {button.icon}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-500">
          Select text to format
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          placeholder={placeholder}
          className="w-full p-4 border-none outline-none resize-none bg-white rounded-b-lg min-h-[120px] font-mono text-sm leading-relaxed"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace' }}
        />
        
        {/* Preview overlay for formatted text */}
        <div className="absolute inset-0 p-4 pointer-events-none bg-transparent rounded-b-lg overflow-hidden">
          <div 
            className="whitespace-pre-wrap text-transparent select-none min-h-[120px] text-sm leading-relaxed"
            style={{ 
              fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
              background: `linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text'
            }}
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^(•\s.+)$/gm, '<span style="color: #059669;">$1</span>')
                .replace(/^(\d+\.\s.+)$/gm, '<span style="color: #dc2626;">$1</span>')
            }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200 rounded-b-lg text-xs">
        <div className="flex items-center gap-4">
          <span className={`${isValidLength ? 'text-green-600' : 'text-amber-600'}`}>
            {plainText.length}/{maxLength} characters
          </span>
          {minLength > 0 && plainText.length > 0 && plainText.length < minLength && (
            <span className="text-amber-600">
              At least {minLength} characters needed
            </span>
          )}
        </div>
        <div className="text-gray-500">
          Use **bold**, *italic*, • bullets, 1. numbers
        </div>
      </div>
    </div>
  )
}