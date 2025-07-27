import { createSeedUser } from "@/lib/actions"

async function seed() {
  console.log("Criando usuário seed...")
  const result = await createSeedUser()
  console.log(result.message)
}

seed().catch(console.error)
