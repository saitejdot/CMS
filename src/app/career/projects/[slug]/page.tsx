import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

interface ProjectDoc {
  title: string;
  description: string;
  content: string;
  technologies: string[];
  coverImage?: string;
  githubUrl?: string;
  liveUrl?: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await connectDB();
    const { slug } = await params;
    const project = await Project.findOne({ slug, status: "PUBLISHED" }).lean() as { title: string; description: string } | null;
    if (!project) return { title: "Project Not Found" };
    return {
      title: `${project.title} — Naga Sai Teja`,
      description: project.description,
    };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  let project: ProjectDoc | null = null;

  try {
    await connectDB();
    project = await Project.findOne({ slug, status: "PUBLISHED" }).lean() as ProjectDoc | null;
  } catch (err) {
    console.error("Project page error:", err);
  }

  if (!project) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {project.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverImage}
          alt={project.title}
          className="w-full h-64 object-cover rounded-lg mb-8"
        />
      )}

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {project.title}
      </h1>
      <p className="mb-4" style={{ color: "var(--muted)" }}>{project.description}</p>

      {project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: "var(--border)", color: "var(--muted)" }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
            GitHub →
          </a>
        )}
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
            Live Demo →
          </a>
        )}
      </div>

      <div className="h-px mb-8" style={{ backgroundColor: "var(--border)" }} />

      <article
        className="story-content prose-content"
        dangerouslySetInnerHTML={{ __html: project.content }}
      />
    </main>
  );
}
