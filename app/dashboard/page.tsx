import { getUser, getProjects } from "@/lib/actions"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProjectGrid } from "@/components/project-grid"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  const projects = await getProjects()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Meus Projetos</h1>
            <CreateProjectDialog />
          </div>
          <ProjectGrid projects={projects} />
        </div>
      </main>
    </div>
  )
}
