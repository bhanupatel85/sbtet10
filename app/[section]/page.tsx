import { notFound } from "next/navigation"
import { PortalShell } from "@/components/portal-shell"

const sections = ["attendance", "results", "syllabus", "announcements", "admissions", "directory", "guides"]

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section)) notFound()
  return <PortalShell section={section} />
}

export function generateStaticParams() {
  return sections.map((section) => ({ section }))
}
