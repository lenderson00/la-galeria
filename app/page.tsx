import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const user = await getUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
