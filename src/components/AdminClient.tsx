"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

interface Blog {
  _id: string;
  title: string;
  category: string;
  content: string;
  tags?: string[];
  likes?: number;
  views?: number;
}

/* ───────────────────────────────────────────────
   RICH TEXT EDITOR COMPONENT
   ─────────────────────────────────────────────── */

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  // Init editor content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    syncContent();
  }, [syncContent]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editorRef.current?.focus();

      if (mediaType === "image") {
        const html = `<div class="blog-media-wrapper" contenteditable="false" style="margin:16px 0;text-align:center;">
          <img src="${dataUrl}" alt="Blog image" style="max-width:100%;height:auto;border-radius:8px;cursor:pointer;" onclick="this.style.maxWidth=this.style.maxWidth==='50%'?'100%':'50%'" />
          <div style="margin-top:4px;">
            <button class="admin-remove-media-btn" onclick="this.parentElement.parentElement.remove()" style="background:#e5383b;color:white;border:none;padding:2px 10px;border-radius:4px;font-size:12px;cursor:pointer;">Remove</button>
          </div>
        </div><p><br></p>`;
        document.execCommand("insertHTML", false, html);
      } else if (mediaType === "video") {
        const html = `<div class="blog-media-wrapper" contenteditable="false" style="margin:16px 0;text-align:center;">
          <video controls style="max-width:100%;border-radius:8px;" src="${dataUrl}"></video>
          <div style="margin-top:4px;">
            <button class="admin-remove-media-btn" onclick="this.parentElement.parentElement.remove()" style="background:#e5383b;color:white;border:none;padding:2px 10px;border-radius:4px;font-size:12px;cursor:pointer;">Remove</button>
          </div>
        </div><p><br></p>`;
        document.execCommand("insertHTML", false, html);
      } else if (mediaType === "audio") {
        const html = `<div class="blog-media-wrapper" contenteditable="false" style="margin:16px 0;text-align:center;">
          <audio controls style="width:100%;" src="${dataUrl}"></audio>
          <div style="margin-top:4px;">
            <button class="admin-remove-media-btn" onclick="this.parentElement.parentElement.remove()" style="background:#e5383b;color:white;border:none;padding:2px 10px;border-radius:4px;font-size:12px;cursor:pointer;">Remove</button>
          </div>
        </div><p><br></p>`;
        document.execCommand("insertHTML", false, html);
      }

      syncContent();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const colors = [
    "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
    "#e5383b", "#ff6b6b", "#ff922b", "#fcc419", "#51cf66", "#20c997",
    "#339af0", "#5c7cfa", "#845ef7", "#e64980", "#f06595", "#cc5de8",
  ];

  return (
    <div className="rte-container">
      {/* TOOLBAR */}
      <div className="rte-toolbar">
        {/* ROW 1: Text formatting */}
        <div className="rte-toolbar-row">
          <button type="button" onClick={() => exec("bold")} title="Bold" className="rte-btn">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => exec("italic")} title="Italic" className="rte-btn">
            <em>I</em>
          </button>
          <button type="button" onClick={() => exec("underline")} title="Underline" className="rte-btn">
            <u>U</u>
          </button>
          <button type="button" onClick={() => exec("strikeThrough")} title="Strikethrough" className="rte-btn">
            <s>S</s>
          </button>

          <div className="rte-divider" />

          {/* Font size */}
          <select
            onChange={(e) => exec("fontSize", e.target.value)}
            defaultValue="3"
            className="rte-select"
            title="Font Size"
          >
            <option value="1">Small</option>
            <option value="2">Normal-</option>
            <option value="3">Normal</option>
            <option value="4">Medium</option>
            <option value="5">Large</option>
            <option value="6">X-Large</option>
            <option value="7">XX-Large</option>
          </select>

          {/* Font family */}
          <select
            onChange={(e) => exec("fontName", e.target.value)}
            defaultValue=""
            className="rte-select"
            title="Font Family"
          >
            <option value="">Default</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Trebuchet MS">Trebuchet MS</option>
          </select>

          <div className="rte-divider" />

          {/* Text color */}
          <div className="rte-color-wrapper">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowBgColorPicker(false);
              }}
              className="rte-btn"
              title="Text Color"
            >
              <span style={{ borderBottom: "3px solid #e5383b" }}>A</span>
            </button>
            {showColorPicker && (
              <div className="rte-color-grid">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="rte-color-swatch"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      exec("foreColor", c);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight/BG color */}
          <div className="rte-color-wrapper">
            <button
              type="button"
              onClick={() => {
                setShowBgColorPicker(!showBgColorPicker);
                setShowColorPicker(false);
              }}
              className="rte-btn"
              title="Highlight Color"
            >
              <span style={{ backgroundColor: "#fcc419", padding: "0 3px", borderRadius: 2 }}>H</span>
            </button>
            {showBgColorPicker && (
              <div className="rte-color-grid">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="rte-color-swatch"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      exec("hiliteColor", c);
                      setShowBgColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Structure + alignment + media */}
        <div className="rte-toolbar-row">
          <button type="button" onClick={() => exec("formatBlock", "<h1>")} className="rte-btn" title="Heading 1">
            H1
          </button>
          <button type="button" onClick={() => exec("formatBlock", "<h2>")} className="rte-btn" title="Heading 2">
            H2
          </button>
          <button type="button" onClick={() => exec("formatBlock", "<h3>")} className="rte-btn" title="Heading 3">
            H3
          </button>
          <button type="button" onClick={() => exec("formatBlock", "<p>")} className="rte-btn" title="Paragraph">
            P
          </button>
          <button type="button" onClick={() => exec("formatBlock", "<blockquote>")} className="rte-btn rte-btn-quote" title="Quote">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
          </button>

          <div className="rte-divider" />

          <button type="button" onClick={() => exec("justifyLeft")} className="rte-btn" title="Align Left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
          </button>
          <button type="button" onClick={() => exec("justifyCenter")} className="rte-btn" title="Align Center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
          </button>
          <button type="button" onClick={() => exec("justifyRight")} className="rte-btn" title="Align Right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
          </button>

          <div className="rte-divider" />

          <button type="button" onClick={() => exec("insertUnorderedList")} className="rte-btn" title="Bullet List">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
          </button>
          <button type="button" onClick={() => exec("insertOrderedList")} className="rte-btn" title="Numbered List">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>
          </button>

          <div className="rte-divider" />

          <button type="button" onClick={() => exec("insertHorizontalRule")} className="rte-btn" title="Horizontal Rule">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt("Enter link URL:");
              if (url) exec("createLink", url);
            }}
            className="rte-btn"
            title="Insert Link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button type="button" onClick={() => exec("removeFormat")} className="rte-btn" title="Clear Formatting">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ROW 3: Media */}
        <div className="rte-toolbar-row rte-media-row">
          <span className="rte-label">Add Media:</span>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as "image" | "video" | "audio")}
            className="rte-select"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rte-btn rte-media-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            <span style={{marginLeft: 4}}>Upload {mediaType}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept={
              mediaType === "image"
                ? "image/*"
                : mediaType === "video"
                  ? "video/*"
                  : "audio/*"
            }
            hidden
          />
        </div>
      </div>

      {/* EDITOR AREA */}
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        onInput={syncContent}
        onBlur={syncContent}
        data-placeholder="Start writing your blog post..."
      />
    </div>
  );
}

/* ───────────────────────────────────────────────
   ADMIN CLIENT COMPONENT
   ─────────────────────────────────────────────── */

export default function AdminClient() {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("tech");
  const [tags, setTags] = useState("");

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");

  // Subscribers
  const [subscribers, setSubscribers] = useState<{ email: string; createdAt: string }[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [subLoading, setSubLoading] = useState(true);

  const fetchBlogs = async () => {
    const res = await fetch("/api/blog");
    const data = await res.json();
    if (data.success) setBlogs(data.data);
  };

  const fetchSubscribers = async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscribers");
      const data = await res.json();
      if (data.success) {
        setSubCount(data.count ?? 0);
        setSubscribers(data.subscribers ?? []);
      }
    } catch {}
    setSubLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlogs();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscribers();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required!");
      return;
    }

    await fetch("/api/blog/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        coverImage: "",
      }),
    });

    setTitle("");
    setContent("");
    setTags("");
    fetchBlogs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    await fetch("/api/blog/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    fetchBlogs();
  };

  const startEditing = (blog: Blog) => {
    setEditingId(blog._id);
    setEditTitle(blog.title);
    setEditContent(blog.content);
    setEditCategory(blog.category);
    setEditTags(blog.tags?.join(", ") || "");
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("Title and content are required!");
      return;
    }

    await fetch("/api/blog/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: editingId,
        title: editTitle,
        content: editContent,
        category: editCategory,
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });

    setEditingId(null);
    fetchBlogs();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/admin/login");
  };

  return (
    <main className="admin-dashboard">
      <BackButton />
      <div className="mb-6"></div>
      <div className="admin-header">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>

      {/* CREATE BLOG */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Create New Post
        </h2>

        <input
          placeholder="Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="admin-input"
        />

        <div className="admin-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="admin-select"
          >
            <option value="tech">Tech</option>
            <option value="fitness">Fitness</option>
            <option value="life">Life</option>
            <option value="motivation">Motivation</option>
          </select>

          <input
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="admin-input"
            style={{ flex: 1 }}
          />
        </div>

        <RichTextEditor value={content} onChange={setContent} />

        <button onClick={handleCreate} className="admin-create-btn">
          Publish Post
        </button>
      </div>

      {/* BLOG LIST */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          All Posts ({blogs.length})
        </h2>

        {blogs.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem 0" }}>
            No posts yet. Create your first post above!
          </p>
        )}

        {blogs.map((blog) => (
          <div key={blog._id} className="admin-blog-card">
            {editingId === blog._id ? (
              <div className="admin-edit-form">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="admin-input"
                  placeholder="Title"
                />

                <div className="admin-row">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="admin-select"
                  >
                    <option value="tech">Tech</option>
                    <option value="fitness">Fitness</option>
                    <option value="life">Life</option>
                    <option value="motivation">Motivation</option>
                  </select>
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="admin-input"
                    placeholder="Tags (comma separated)"
                    style={{ flex: 1 }}
                  />
                </div>

                <RichTextEditor value={editContent} onChange={setEditContent} />

                <div className="admin-edit-actions">
                  <button onClick={handleUpdate} className="admin-save-btn">
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="admin-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-blog-row">
                <div className="admin-blog-info">
                  <h3 className="admin-blog-title">{blog.title}</h3>
                  <div className="admin-blog-meta">
                    <span className="admin-category-badge">{blog.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {blog.likes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {blog.views || 0} views
                    </span>
                  </div>
                </div>

                <div className="admin-blog-actions">
                  <button
                    onClick={() => startEditing(blog)}
                    className="admin-edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog._id)}
                    className="admin-delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* SUBSCRIBERS */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Subscribers ({subCount})
        </h2>

        {subLoading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "1.5rem 0" }}>Loading…</p>
        ) : subscribers.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "1.5rem 0" }}>No subscribers yet.</p>
        ) : (
          <>
            {/* Copy all emails */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                className="admin-edit-btn"
                onClick={() => {
                  const emails = subscribers.map((s) => s.email).join(", ");
                  navigator.clipboard.writeText(emails);
                }}
              >
                Copy all emails
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subscribed On</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, i) => (
                    <tr
                      key={sub.email}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "9px 12px", color: "var(--muted)", fontSize: "0.8rem" }}>{i + 1}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 500 }}>{sub.email}</td>
                      <td style={{ padding: "9px 12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" "}
                        <span style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                          {new Date(sub.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}