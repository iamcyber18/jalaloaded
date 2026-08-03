'use client';

import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  minHeight?: string;
  sectionNum?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  label,
  description,
  placeholder = 'Write your content here...',
  minHeight = '140px',
  sectionNum,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // Insert or wrap text at cursor position in textarea
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    let replacement = '';
    let newCursorStart = start;
    let newCursorEnd = end;

    if (selectedText.length > 0) {
      // User highlighted text
      replacement = `${prefix}${selectedText}${suffix}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + selectedText.length;
    } else {
      // No text highlighted, insert default placeholder
      replacement = `${prefix}${defaultText}${suffix}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + defaultText.length;
    }

    const updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
    onChange(updatedText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Line prefix formatting (e.g. headings, lists, quotes)
  const applyLinePrefix = (prefix: string, defaultText: string = 'Heading text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    // Find start of current line
    const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = currentText.indexOf('\n', end);
    const actualLineEnd = lineEnd === -1 ? currentText.length : lineEnd;

    const selectedLines = currentText.substring(lineStart, actualLineEnd);
    const lines = selectedLines.split('\n');

    const formattedLines = lines.map((line, idx) => {
      // Remove existing prefixes if repeating
      const cleanLine = line.replace(/^#{1,6}\s+|^\s*[-*+]\s+|^\s*\d+\.\s+|^>\s+/, '');
      if (prefix.includes('\n')) return prefix;
      if (prefix === '1. ') return `${idx + 1}. ${cleanLine || defaultText}`;
      return `${prefix}${cleanLine || defaultText}`;
    });

    const replacement = formattedLines.join('\n');
    const updatedText = currentText.substring(0, lineStart) + replacement + currentText.substring(actualLineEnd);
    onChange(updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + replacement.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        insertFormatting('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        insertFormatting('*', '*', 'italic text');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          insertFormatting('[', `](${url})`, 'link text');
        }
      }
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="rich-editor-card">
      {/* HEADER BAR */}
      <div className="rich-editor-header">
        <div className="rich-editor-title-group">
          {sectionNum !== undefined && <div className="section-num">{sectionNum}</div>}
          <div>
            {label && <div className="field-label" style={{ marginBottom: 0 }}>{label}</div>}
            {description && <div className="rich-editor-desc">{description}</div>}
          </div>
        </div>

        {/* TABS SWITCHER */}
        <div className="rich-editor-tabs">
          <button
            type="button"
            className={`rich-editor-tab ${activeTab === 'write' ? 'active' : ''}`}
            onClick={() => setActiveTab('write')}
          >
            ✏️ Write
          </button>
          <button
            type="button"
            className={`rich-editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      {activeTab === 'write' && (
        <div className="rich-toolbar">
          <div className="rich-toolbar-group">
            <button
              type="button"
              className="rich-btn"
              title="Bold (Ctrl+B)"
              onClick={() => insertFormatting('**', '**', 'bold text')}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="rich-btn"
              title="Italic (Ctrl+I)"
              onClick={() => insertFormatting('*', '*', 'italic text')}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="rich-btn"
              title="Underline / Highlight"
              onClick={() => insertFormatting('<ins>', '</ins>', 'underlined text')}
            >
              <u>U</u>
            </button>
          </div>

          <div className="rich-toolbar-sep"></div>

          <div className="rich-toolbar-group">
            <button
              type="button"
              className="rich-btn text-btn"
              title="Heading 2 (Main Subtitle)"
              onClick={() => applyLinePrefix('## ', 'Main Heading')}
            >
              H2
            </button>
            <button
              type="button"
              className="rich-btn text-btn"
              title="Heading 3 (Sub-heading)"
              onClick={() => applyLinePrefix('### ', 'Sub-heading')}
            >
              H3
            </button>
            <button
              type="button"
              className="rich-btn text-btn"
              title="Bold Heading 2"
              onClick={() => applyLinePrefix('## **', 'Bold Heading**')}
            >
              H2 <b>B</b>
            </button>
          </div>

          <div className="rich-toolbar-sep"></div>

          <div className="rich-toolbar-group">
            <button
              type="button"
              className="rich-btn"
              title="Bulleted List"
              onClick={() => applyLinePrefix('- ', 'List item')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="9" y1="6" x2="20" y2="6" />
                <line x1="9" y1="12" x2="20" y2="12" />
                <line x1="9" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                <circle cx="4" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </button>

            <button
              type="button"
              className="rich-btn"
              title="Numbered List"
              onClick={() => applyLinePrefix('1. ', 'List item')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="20" y2="6" />
                <line x1="10" y1="12" x2="20" y2="12" />
                <line x1="10" y1="18" x2="20" y2="18" />
                <path d="M4 6h2v4H4" />
                <path d="M4 14h2.5L4 18h3" />
              </svg>
            </button>

            <button
              type="button"
              className="rich-btn"
              title="Quote Block"
              onClick={() => applyLinePrefix('> ', 'Quote text')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 2-1 4-4 4v4zm11 0c3 0 7-1 7-8V5h-7v8h4c0 2-1 4-4 4v4z" />
              </svg>
            </button>
          </div>

          <div className="rich-toolbar-sep"></div>

          <div className="rich-toolbar-group">
            <button
              type="button"
              className="rich-btn"
              title="Add Hyperlink (Ctrl+K)"
              onClick={() => {
                const url = prompt('Enter URL:', 'https://');
                if (url) {
                  insertFormatting('[', `](${url})`, 'link text');
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>

            <button
              type="button"
              className="rich-btn"
              title="Inline Code"
              onClick={() => insertFormatting('`', '`', 'code')}
            >
              <code>&lt;/&gt;</code>
            </button>

            <button
              type="button"
              className="rich-btn"
              title="Horizontal Divider"
              onClick={() => insertFormatting('\n\n---\n\n', '', '')}
            >
              —
            </button>
          </div>
        </div>
      )}

      {/* EDITOR INPUT OR PREVIEW */}
      <div className="rich-editor-body">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            className="field-body rich-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight }}
          />
        ) : (
          <div className="rich-preview-panel article-body" style={{ minHeight }}>
            {value.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  blockquote: ({ children }: any) => <div className="pull-quote"><p>{children}</p></div>,
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <div className="rich-preview-empty">Nothing to preview yet. Start typing in the Write tab!</div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER METRICS */}
      <div className="rich-editor-footer">
        <div className="rich-editor-tip">
          Shortcuts: <strong>Ctrl+B</strong> (Bold), <strong>Ctrl+I</strong> (Italic), <strong>Ctrl+K</strong> (Link)
        </div>
        <div className="rich-editor-stats">
          <span>{wordCount} words</span>
          <span>&bull;</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
}
