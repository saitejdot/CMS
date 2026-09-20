"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import TipTapEditor from "@/components/TipTapEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  _id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  content: string;
  tags?: string[];
  likes?: number;
  views?: number;
}

interface Project {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  status: string;
}

interface CareerItem {
  _id: string;
  type: string;
  title: string;
  organization: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  skills?: string[];
}

interface Subscriber {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

const STORY_CATEGORIES = ["Tech", "Life", "Fitness", "Motivation", "Thoughts", "Philosophies", "Other"];
const CAREER_TYPES = ["experience", "education", "certification", "achievement"];
const TABS = ["Stories", "Projects", "Career", "Pages", "Subscribers"] as const;
type Tab = typeof TABS[number];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PUBLISHED: "#51cf66",
    DRAFT: "#fcc419",
    ARCHIVED: "#adb5bd",
    TRASH: "#e5383b",
  };
  return (
    <span style={{
      display: "inline-block",
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "2px 8px",
      borderRadius: 99,
      background: `${colors[status] ?? "#adb5bd"}22`,
      color: colors[status] ?? "#adb5bd",
    }}>{status}</span>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────

export default function AdminClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Stories");

  // Stories
  const [stories, setStories] = useState<Story[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [storySlug, setStorySlug] = useState("");
  const [storyCategory, setStoryCategory] = useState("Tech");
  const [storyTags, setStoryTags] = useState("");
  const [storyStatus, setStoryStatus] = useState("DRAFT");
  const [storyContent, setStoryContent] = useState("");
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectTech, setProjectTech] = useState("");
  const [projectGithub, setProjectGithub] = useState("");
  const [projectLive, setProjectLive] = useState("");
  const [projectStatus, setProjectStatus] = useState("DRAFT");
  const [projectContent, setProjectContent] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Career
  const [careerItems, setCareerItems] = useState<CareerItem[]>([]);
  const [careerType, setCareerType] = useState("experience");
  const [careerTitle, setCareerTitle] = useState("");
  const [careerOrg, setCareerOrg] = useState("");
  const [careerLocation, setCareerLocation] = useState("");
  const [careerStart, setCareerStart] = useState("");
  const [careerEnd, setCareerEnd] = useState("");
  const [careerCurrent, setCareerCurrent] = useState(false);
  const [careerDesc, setCareerDesc] = useState("");
  const [careerSkills, setCareerSkills] = useState("");
  const [editingCareer, setEditingCareer] = useState<CareerItem | null>(null);

  // Pages
  const [aboutContent, setAboutContent] = useState("");
  const [aboutTitle, setAboutTitle] = useState("About Me");
  const [nowContent, setNowContent] = useState("");
  const [nowTitle, setNowTitle] = useState("What I'm Doing Now");
  const [pagesSaved, setPagesSaved] = useState<Record<string, boolean>>({});

  // Subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // ─── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchStories = async () => {
    const res = await fetch("/api/admin/stories");
    const data = await res.json();
    if (data.success) setStories(data.data);
  };

  const fetchProjects = async () => {
    const res = await fetch("/api/admin/projects");
    const data = await res.json();
    if (data.success) setProjects(data.data);
  };

  const fetchCareer = async () => {
    const res = await fetch("/api/admin/career");
    const data = await res.json();
    if (data.success) setCareerItems(data.data);
  };

  const fetchPages = async () => {
    const [aboutRes, nowRes] = await Promise.all([
      fetch("/api/admin/pages?pageId=about"),
      fetch("/api/admin/pages?pageId=now"),
    ]);
    const aboutData = await aboutRes.json();
    const nowData = await nowRes.json();
    if (aboutData.success && aboutData.data) {
      setAboutTitle(aboutData.data.title || "About Me");
      setAboutContent(aboutData.data.content || "");
    }
    if (nowData.success && nowData.data) {
      setNowTitle(nowData.data.title || "What I'm Doing Now");
      setNowContent(nowData.data.content || "");
    }
  };

  const fetchSubscribers = async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      const data = await res.json();
      if (data.success) setSubscribers(data.subscribers ?? []);
    } catch { /* ignore */ }
    setSubLoading(false);
  };

  useEffect(() => {
    fetchStories();
    fetchSubscribers();
  }, []);

  useEffect(() => {
    if (activeTab === "Projects") fetchProjects();
    if (activeTab === "Career") fetchCareer();
    if (activeTab === "Pages") fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─── Story CRUD ─────────────────────────────────────────────────────────────

  const handleCreateStory = async () => {
    if (!storyTitle.trim() || !storyContent.trim()) return alert("Title and content required");
    const slug = storySlug || storyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await fetch("/api/admin/stories/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: storyTitle, slug, content: storyContent,
        category: storyCategory, status: storyStatus,
        tags: storyTags.split(",").map((t) => t.trim()).filter(Boolean),
        coverImage: "",
        sendEmail: sendEmailNotification,
      }),
    });
    setStoryTitle(""); setStorySlug(""); setStoryContent(""); setStoryTags(""); setSendEmailNotification(true);
    fetchStories();
  };

  const handleUpdateStory = async () => {
    if (!editingStory || !editingStory.title.trim()) return;
    try {
      const res = await fetch("/api/admin/stories/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingStory._id,
          title: editingStory.title,
          content: editingStory.content ?? "",
          category: editingStory.category,
          status: editingStory.status,
          tags: Array.isArray(editingStory.tags) ? editingStory.tags : [],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("Failed to update story: " + (data.error || "Unknown error"));
        return;
      }
      setEditingStory(null);
      fetchStories();
    } catch (err) {
      console.error(err);
      alert("Error updating story");
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Move this story to Trash?")) return;
    await fetch("/api/admin/stories/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchStories();
  };

  // ─── Project CRUD ────────────────────────────────────────────────────────────

  const handleCreateProject = async () => {
    if (!projectTitle.trim() || !projectContent.trim()) return alert("Title and content required");
    const slug = projectSlug || projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: projectTitle, slug, description: projectDesc, content: projectContent,
        technologies: projectTech.split(",").map((t) => t.trim()).filter(Boolean),
        githubUrl: projectGithub, liveUrl: projectLive, status: projectStatus,
      }),
    });
    setProjectTitle(""); setProjectSlug(""); setProjectDesc(""); setProjectContent(""); setProjectTech(""); setProjectGithub(""); setProjectLive("");
    fetchProjects();
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    await fetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingProject),
    });
    setEditingProject(null);
    fetchProjects();
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/admin/projects?id=${id}`, { method: "DELETE" });
    fetchProjects();
  };

  // ─── Career CRUD ─────────────────────────────────────────────────────────────

  const handleCreateCareer = async () => {
    if (!careerTitle.trim() || !careerOrg.trim()) return alert("Title and organization required");
    await fetch("/api/admin/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: careerType, title: careerTitle, organization: careerOrg,
        location: careerLocation, startDate: careerStart || null, endDate: careerEnd || null,
        isCurrent: careerCurrent, description: careerDesc,
        skills: careerSkills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setCareerTitle(""); setCareerOrg(""); setCareerLocation(""); setCareerStart(""); setCareerEnd(""); setCareerCurrent(false); setCareerDesc(""); setCareerSkills("");
    fetchCareer();
  };

  const handleDeleteCareer = async (id: string) => {
    if (!confirm("Delete this career item?")) return;
    await fetch(`/api/admin/career?id=${id}`, { method: "DELETE" });
    fetchCareer();
  };

  // ─── Pages save ──────────────────────────────────────────────────────────────

  const savePage = async (pageId: string, title: string, content: string) => {
    await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, title, content }),
    });
    setPagesSaved((p) => ({ ...p, [pageId]: true }));
    setTimeout(() => setPagesSaved((p) => ({ ...p, [pageId]: false })), 2000);
  };

  // ─── Logout ───────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="admin-dashboard">
      <BackButton />
      <div className="mb-6" />

      <div className="admin-header">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid",
              borderColor: activeTab === tab ? "var(--accent)" : "var(--border)",
              background: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "white" : "var(--text)",
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── STORIES TAB ───────────────────────────────────────────────────────── */}
      {activeTab === "Stories" && (
        <>
          <div className="admin-section">
            <h2 className="admin-section-title">Create New Story</h2>
            <input placeholder="Title" value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} className="admin-input" />
            <input placeholder="Slug (auto-generated if empty)" value={storySlug} onChange={(e) => setStorySlug(e.target.value)} className="admin-input" />
            <div className="admin-row">
              <select value={storyCategory} onChange={(e) => setStoryCategory(e.target.value)} className="admin-select">
                {STORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={storyStatus} onChange={(e) => setStoryStatus(e.target.value)} className="admin-select">
                {["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input placeholder="Tags (comma separated)" value={storyTags} onChange={(e) => setStoryTags(e.target.value)} className="admin-input" style={{ flex: 1 }} />
            </div>
            <div className="admin-row" style={{ marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer", color: "var(--text)" }}>
                <input type="checkbox" checked={sendEmailNotification} onChange={(e) => setSendEmailNotification(e.target.checked)} />
                Send email notification to subscribers
              </label>
            </div>
            <TipTapEditor value={storyContent} onChange={setStoryContent} />
            <button onClick={handleCreateStory} className="admin-create-btn">Create Story</button>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">All Stories ({stories.length})</h2>
            {stories.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>No stories yet.</p>}
            {stories.map((story) => (
              <div key={story._id} className="admin-story-card">
                {editingStory?._id === story._id ? (
                  <div className="admin-edit-form">
                    <input value={editingStory.title} onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })} className="admin-input" placeholder="Title" />
                    <div className="admin-row">
                      <select value={editingStory.category} onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })} className="admin-select">
                        {STORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={editingStory.status} onChange={(e) => setEditingStory({ ...editingStory, status: e.target.value })} className="admin-select">
                        {["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <TipTapEditor value={editingStory.content} onChange={(html) => setEditingStory({ ...editingStory, content: html })} />
                    <div className="admin-edit-actions">
                      <button onClick={handleUpdateStory} className="admin-save-btn">Save</button>
                      <button onClick={() => setEditingStory(null)} className="admin-cancel-btn">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-story-row">
                    <div className="admin-story-info">
                      <h3 className="admin-story-title">{story.title}</h3>
                      <div className="admin-story-meta">
                        <StatusBadge status={story.status} />
                        <span className="admin-category-badge">{story.category}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>❤ {story.likes ?? 0} · 👁 {story.views ?? 0}</span>
                      </div>
                    </div>
                    <div className="admin-story-actions">
                      <button onClick={() => setEditingStory(story)} className="admin-edit-btn">Edit</button>
                      <button onClick={() => handleDeleteStory(story._id)} className="admin-delete-btn">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── PROJECTS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "Projects" && (
        <>
          <div className="admin-section">
            <h2 className="admin-section-title">Create New Project</h2>
            <input placeholder="Project Title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="admin-input" />
            <input placeholder="Slug (auto-generated if empty)" value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} className="admin-input" />
            <input placeholder="Short description" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="admin-input" />
            <div className="admin-row">
              <input placeholder="Technologies (comma separated)" value={projectTech} onChange={(e) => setProjectTech(e.target.value)} className="admin-input" style={{ flex: 1 }} />
              <select value={projectStatus} onChange={(e) => setProjectStatus(e.target.value)} className="admin-select">
                {["DRAFT", "PUBLISHED"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-row">
              <input placeholder="GitHub URL" value={projectGithub} onChange={(e) => setProjectGithub(e.target.value)} className="admin-input" style={{ flex: 1 }} />
              <input placeholder="Live URL" value={projectLive} onChange={(e) => setProjectLive(e.target.value)} className="admin-input" style={{ flex: 1 }} />
            </div>
            <TipTapEditor value={projectContent} onChange={setProjectContent} />
            <button onClick={handleCreateProject} className="admin-create-btn">Create Project</button>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">All Projects ({projects.length})</h2>
            {projects.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>No projects yet.</p>}
            {projects.map((project) => (
              <div key={project._id} className="admin-story-card">
                {editingProject?._id === project._id ? (
                  <div className="admin-edit-form">
                    <input value={editingProject.title} onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })} className="admin-input" placeholder="Title" />
                    <input value={editingProject.description} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} className="admin-input" placeholder="Description" />
                    <div className="admin-row">
                      <input value={editingProject.technologies.join(", ")} onChange={(e) => setEditingProject({ ...editingProject, technologies: e.target.value.split(",").map((t) => t.trim()) })} className="admin-input" placeholder="Technologies" style={{ flex: 1 }} />
                      <select value={editingProject.status} onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })} className="admin-select">
                        {["DRAFT", "PUBLISHED"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <TipTapEditor value={editingProject.content} onChange={(html) => setEditingProject({ ...editingProject, content: html })} />
                    <div className="admin-edit-actions">
                      <button onClick={handleUpdateProject} className="admin-save-btn">Save</button>
                      <button onClick={() => setEditingProject(null)} className="admin-cancel-btn">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-story-row">
                    <div className="admin-story-info">
                      <h3 className="admin-story-title">{project.title}</h3>
                      <div className="admin-story-meta">
                        <StatusBadge status={project.status} />
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{project.technologies.slice(0, 3).join(" · ")}</span>
                      </div>
                    </div>
                    <div className="admin-story-actions">
                      <button onClick={() => setEditingProject(project)} className="admin-edit-btn">Edit</button>
                      <button onClick={() => handleDeleteProject(project._id)} className="admin-delete-btn">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CAREER TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "Career" && (
        <>
          <div className="admin-section">
            <h2 className="admin-section-title">Add Career Item</h2>
            <div className="admin-row">
              <select value={careerType} onChange={(e) => setCareerType(e.target.value)} className="admin-select">
                {CAREER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input placeholder="Title / Degree / Certificate" value={careerTitle} onChange={(e) => setCareerTitle(e.target.value)} className="admin-input" />
            <input placeholder="Organization / University / Issuer" value={careerOrg} onChange={(e) => setCareerOrg(e.target.value)} className="admin-input" />
            <div className="admin-row">
              <input placeholder="Location (optional)" value={careerLocation} onChange={(e) => setCareerLocation(e.target.value)} className="admin-input" style={{ flex: 1 }} />
              <input type="date" value={careerStart} onChange={(e) => setCareerStart(e.target.value)} className="admin-input" title="Start date" />
              <input type="date" value={careerEnd} onChange={(e) => setCareerEnd(e.target.value)} className="admin-input" disabled={careerCurrent} title="End date" />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={careerCurrent} onChange={(e) => setCareerCurrent(e.target.checked)} />
                Present
              </label>
            </div>
            <input placeholder="Skills (comma separated)" value={careerSkills} onChange={(e) => setCareerSkills(e.target.value)} className="admin-input" />
            <textarea placeholder="Description (optional)" value={careerDesc} onChange={(e) => setCareerDesc(e.target.value)} className="admin-input" rows={3} style={{ resize: "vertical" }} />
            <button onClick={handleCreateCareer} className="admin-create-btn">Add Item</button>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">All Career Items ({careerItems.length})</h2>
            {careerItems.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>No career items yet.</p>}
            {careerItems.map((item) => (
              <div key={item._id} className="admin-story-card">
                <div className="admin-story-row">
                  <div className="admin-story-info">
                    <h3 className="admin-story-title">{item.title}</h3>
                    <div className="admin-story-meta">
                      <span className="admin-category-badge">{item.type}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.organization}</span>
                      {item.isCurrent && <span style={{ fontSize: "0.7rem", color: "#51cf66" }}>● Current</span>}
                    </div>
                  </div>
                  <div className="admin-story-actions">
                    <button onClick={() => handleDeleteCareer(item._id)} className="admin-delete-btn">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── PAGES TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === "Pages" && (
        <>
          <div className="admin-section">
            <h2 className="admin-section-title">About Page</h2>
            <input placeholder="Page title" value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} className="admin-input" />
            <TipTapEditor value={aboutContent} onChange={setAboutContent} />
            <button onClick={() => savePage("about", aboutTitle, aboutContent)} className="admin-create-btn">
              {pagesSaved["about"] ? "✓ Saved!" : "Save About Page"}
            </button>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">Now Page</h2>
            <input placeholder="Page title" value={nowTitle} onChange={(e) => setNowTitle(e.target.value)} className="admin-input" />
            <TipTapEditor value={nowContent} onChange={setNowContent} />
            <button onClick={() => savePage("now", nowTitle, nowContent)} className="admin-create-btn">
              {pagesSaved["now"] ? "✓ Saved!" : "Save Now Page"}
            </button>
          </div>
        </>
      )}

      {/* ── SUBSCRIBERS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "Subscribers" && (
        <div className="admin-section">
          <h2 className="admin-section-title">Subscribers ({subscribers.length})</h2>
          {subLoading ? (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "1.5rem" }}>Loading…</p>
          ) : subscribers.length === 0 ? (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "1.5rem" }}>No subscribers yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <button className="admin-edit-btn" onClick={() => navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "))}>
                  Copy all emails
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["#", "Name", "Email", "Subscribed On"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub, i) => (
                      <tr key={sub._id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "9px 12px", color: "var(--muted)", fontSize: "0.8rem" }}>{i + 1}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 500 }}>{sub.name}</td>
                        <td style={{ padding: "9px 12px" }}>{sub.email}</td>
                        <td style={{ padding: "9px 12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}