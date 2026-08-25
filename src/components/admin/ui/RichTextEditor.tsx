"use client";

import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  RemoveFormatting,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write garment details, fabric composition, tailoring specifications...",
  minHeight = "160px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value when editor is not focused
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
      exec("createLink", url);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-slate-50 border-b border-slate-200 text-slate-700">
        <button
          type="button"
          onClick={() => exec("bold")}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          title="Underline (Ctrl+U)"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          title="Heading 2"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h3>")}
          title="Heading 3"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          title="Numbered List"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<blockquote>")}
          title="Quote"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Quote className="w-4 h-4" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={handleLink}
          title="Insert Link"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("removeFormat")}
          title="Clear Formatting"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="p-4 text-sm font-sans text-slate-900 focus:outline-none prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      />
    </div>
  );
}
