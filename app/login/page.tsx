import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage() {
  const user = await getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">LaGaleria</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Faça login para acessar suas galerias</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
