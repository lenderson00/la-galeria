import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/actions"
import type { User } from "@/lib/db/schema"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">LaGaleria</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Olá, {user.username}</span>
            <form action={logoutAction}>
              <Button variant="outline" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
