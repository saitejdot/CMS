"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useState } from 'react';

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Youtube,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your story here...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      setIsUploading(true);
      editor.commands.focus();
      
      const authRes = await fetch("/api/admin/media/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mediaType,
          mimeType: file.type,
          sizeBytes: file.size,
        })
      });
      const authData = await authRes.json();
      if (!authData.success) {
        alert("Upload auth failed: " + authData.error);
        return;
      }

      const { uploadUrl } = authData.data;

      const fd = new FormData();
      fd.append("file", file);
      
      const cfRes = await fetch(uploadUrl, {
        method: "POST",
        body: fd
      });

      if (!cfRes.ok) {
        alert("Failed to upload to provider");
        return;
      }

      const cfData = await cfRes.json();

      if (mediaType === "image") {
        const deliveryUrl = cfData.result.variants[0];
        editor.chain().focus().setImage({ src: deliveryUrl }).run();
      } else {
        // Video
        const previewUrl = cfData.result.preview;
        const deliveryUrl = previewUrl.replace("/watch", "/iframe");
        // TipTap doesn't have a native iframe video extension easily without custom nodes, 
        // but since we want to embed the iframe, we can just insert raw HTML using commands.insertContent.
        editor.chain().focus().insertContent(`<iframe src="${deliveryUrl}" style="border: none; max-width: 100%; width: 600px; height: 400px; border-radius: 8px;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe><p></p>`).run();
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rte-container">
      <div className="rte-toolbar">
        <div className="rte-toolbar-row">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`rte-btn ${editor.isActive('bold') ? 'is-active' : ''}`} title="Bold">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`rte-btn ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italic">
            <em>I</em>
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`rte-btn ${editor.isActive('strike') ? 'is-active' : ''}`} title="Strike">
            <s>S</s>
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`rte-btn ${editor.isActive('code') ? 'is-active' : ''}`} title="Code">
            &lt;/&gt;
          </button>
          
          <div className="rte-divider" />
          
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`rte-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`} title="H1">H1</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`rte-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`} title="H2">H2</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`rte-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`} title="H3">H3</button>
          
          <div className="rte-divider" />
          
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`rte-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`} title="Bullet List">•</button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`rte-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`} title="Numbered List">1.</button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`rte-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`} title="Quote">"</button>
          
          <div className="rte-divider" />
          
          <button type="button" onClick={setLink} className={`rte-btn ${editor.isActive('link') ? 'is-active' : ''}`} title="Link">🔗</button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="rte-btn" title="Horizontal Rule">—</button>
        </div>

        <div className="rte-toolbar-row rte-media-row">
          <span className="rte-label">Add Media:</span>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value as "image" | "video")} className="rte-select">
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <label className="rte-btn rte-media-btn" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            <span style={{marginLeft: 4}}>{isUploading ? "Uploading..." : `Upload ${mediaType}`}</span>
            <input type="file" onChange={handleMediaUpload} accept={mediaType === "image" ? "image/*" : "video/*"} hidden disabled={isUploading} />
          </label>
        </div>
      </div>
      <EditorContent editor={editor} className="rte-editor tiptap-editor" />
    </div>
  );
}
