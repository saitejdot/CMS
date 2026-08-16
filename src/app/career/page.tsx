import { connectDB } from "@/lib/db";
import Career from "@/models/Career";
import Project from "@/models/Project";
import PageContent from "@/models/PageContent";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career — Naga Sai Teja",
  description: "Professional background, projects, skills, education and certifications of Naga Sai Teja.",
};

export const dynamic = "force-dynamic";

interface CareerItem {
  _id: string;
  type: string;
  title: string;
  organization: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
  description?: string;
  url?: string;
  skills?: string[];
  order?: number;
}

interface ProjectItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  coverImage?: string;
  githubUrl?: string;
  liveUrl?: string;
  status: string;
}

function formatYear(date?: Date | string | null): string {
  if (!date) return "Present";
  return new Date(date).getFullYear().toString();
}

function formatDateRange(start?: Date | string, end?: Date | string, isCurrent?: boolean): string {
  const s = start ? formatYear(start) : "?";
  const e = isCurrent ? "Present" : formatYear(end);
  return `${s} – ${e}`;
}

export default async function CareerPage() {
  let careerItems: CareerItem[] = [];
  let projects: ProjectItem[] = [];
  let resumeContent = "";

  try {
    await connectDB();
    careerItems = (await Career.find().sort({ order: 1, startDate: -1 }).lean()) as unknown as CareerItem[];
    projects = (await Project.find({ status: "PUBLISHED" }).sort({ createdAt: -1 }).lean()) as unknown as ProjectItem[];
    const resumePage = await PageContent.findOne({ pageId: "resume" }).lean() as { content: string } | null;
    if (resumePage) resumeContent = resumePage.content;
  } catch (err) {
    console.error("Career page error:", err);
  }

  const experience = careerItems.filter((c) => c.type === "experience");
  const education = careerItems.filter((c) => c.type === "education");
  const certifications = careerItems.filter((c) => c.type === "certification");
  const achievements = careerItems.filter((c) => c.type === "achievement");

  // Collect all skills from experience items
  const allSkills = Array.from(new Set(careerItems.flatMap((c) => c.skills ?? [])));

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Career
      </h1>
      <div className="h-1 w-12 rounded mb-10" style={{ backgroundColor: "var(--accent)" }} />

      {/* RESUME */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Résumé / CV</h2>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1 rounded border"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Download PDF
          </a>
        </div>
        {resumeContent ? (
          <div className="story-content prose-content" dangerouslySetInnerHTML={{ __html: resumeContent }} />
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Resume content will be available soon. You can download the PDF version above.
          </p>
        )}
      </section>

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Link
                key={project._id}
                href={`/career/projects/${project.slug}`}
                className="card p-5 shadow-sm hover:shadow-md transition-shadow block"
              >
                {project.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full h-40 object-cover rounded mb-4"
                  />
                )}
                <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                  {project.description}
                </p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
                <div className="flex gap-3 mt-4 text-sm">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GitHub →
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Live Demo →
                    </a>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SKILLS */}
      {allSkills.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <span
                key={skill}
                className="text-sm px-3 py-1 rounded"
                style={{ backgroundColor: "var(--border)", color: "var(--text)" }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* EXPERIENCE */}
      {experience.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Experience</h2>
          <div className="space-y-8">
            {experience.map((item) => (
              <div key={item._id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: "var(--accent)" }} />
                  <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: "var(--border)" }} />
                </div>
                <div className="pb-6">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                    {item.organization}{item.location ? ` · ${item.location}` : ""}
                  </p>
                  <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                    {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
                  </p>
                  {item.description && (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EDUCATION */}
      {education.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Education</h2>
          <div className="space-y-6">
            {education.map((item) => (
              <div key={item._id} className="card p-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                  {item.organization}{item.location ? ` · ${item.location}` : ""}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
                </p>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CERTIFICATIONS */}
      {certifications.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((item) => (
              <div key={item._id} className="card p-4">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{item.organization}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline mt-1 block"
                  >
                    View Credential →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACHIEVEMENTS */}
      {achievements.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Achievements</h2>
          <ul className="space-y-3">
            {achievements.map((item) => (
              <li key={item._id} className="flex gap-3 items-start">
                <span style={{ color: "var(--accent)" }}>🏆</span>
                <div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {careerItems.length === 0 && projects.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          Career details coming soon. Check back later!
        </p>
      )}
    </main>
  );
}
