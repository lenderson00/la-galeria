import { getUser, getProject, getProjectImages } from "@/lib/actions"
import { redirect } from "next/navigation"
import { ProjectHeader } from "@/components/project-header"
import { ImageUpload } from "@/components/image-upload"
import { ImageGrid } from "@/components/image-grid"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  const project = await getProject(id)

  if (!project) {
    redirect("/dashboard")
  }

  const images = await getProjectImages(id)

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader project={project} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <ImageUpload projectId={project.id} />
          </div>
          <ImageGrid images={images} projectId={project.id} />
        </div>
      </main>
    </div>
  )
}
