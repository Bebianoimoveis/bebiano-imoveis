import "dotenv/config"
import bcrypt from "bcryptjs"

import { prisma } from "../src/lib/prisma"

// Papéis previstos: Administrador (acesso total), Gestor, Corretor
// (escopo restrito aos próprios leads/imóveis) e Financeiro.
const ROLES = ["ADMIN", "MANAGER", "REALTOR", "FINANCIAL"] as const

const PERMISSIONS = [
  "property.create",
  "property.edit",
  "property.publish",
  "property.delete",
  "property.view.all",
  "taxonomy.manage",
  "lead.view.all",
  "lead.view.own",
  "lead.manage",
  "client.manage",
  "realtor.manage",
  "appointment.manage",
  "appointment.view.all",
  "proposal.manage",
  "proposal.view.all",
  "contract.manage",
  "contract.view.all",
  "financial.view",
  "financial.manage",
  "report.view",
  "user.manage",
  "settings.manage",
] as const

const PERMISSIONS_BY_ROLE: Record<(typeof ROLES)[number], readonly string[]> = {
  ADMIN: PERMISSIONS,
  MANAGER: [
    "property.create",
    "property.edit",
    "property.publish",
    "property.view.all",
    "taxonomy.manage",
    "lead.view.all",
    "lead.manage",
    "client.manage",
    "realtor.manage",
    "appointment.manage",
    "appointment.view.all",
    "proposal.manage",
    "proposal.view.all",
    "contract.manage",
    "contract.view.all",
    "report.view",
  ],
  REALTOR: [
    "property.create",
    "property.edit",
    "lead.view.own",
    "lead.manage",
    "client.manage",
    "appointment.manage",
    "proposal.manage",
  ],
  FINANCIAL: [
    "financial.view",
    "financial.manage",
    "contract.manage",
    "contract.view.all",
    "report.view",
  ],
}

const CITY = { name: "Mogi das Cruzes", state: "SP" }

const NEIGHBORHOODS = [
  "Centro",
  "Vila Oliveira",
  "Mogilar",
  "Braz Cubas",
  "Jundiapeba",
  "Cezar de Souza",
  "Vila Nova União",
]

const PROPERTY_TYPES = [
  "Apartamento",
  "Casa",
  "Casa em Condomínio",
  "Terreno",
  "Sala Comercial",
  "Galpão",
  "Chácara",
]

const PROPERTY_FEATURES = [
  "Piscina",
  "Portaria 24h",
  "Churrasqueira",
  "Academia",
  "Salão de festas",
  "Elevador",
  "Área de lazer",
  "Playground",
  "Quadra poliesportiva",
  "Varanda gourmet",
  "Ar condicionado",
  "Armários planejados",
]

async function main() {
  console.log("Seed: criando permissões...")
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    })
  }

  console.log("Seed: criando papéis e vinculando permissões...")
  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    })

    const permissionKeys = PERMISSIONS_BY_ROLE[roleName]
    const permissions = await prisma.permission.findMany({
      where: { key: { in: [...permissionKeys] } },
    })

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      })
    }
  }

  console.log("Seed: criando cidade, bairros, tipos e características...")
  const city = await prisma.city.upsert({
    where: { name_state: { name: CITY.name, state: CITY.state } },
    update: {},
    create: CITY,
  })

  for (const name of NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { name_cityId: { name, cityId: city.id } },
      update: {},
      create: { name, cityId: city.id },
    })
  }

  for (const name of PROPERTY_TYPES) {
    await prisma.propertyType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  for (const name of PROPERTY_FEATURES) {
    await prisma.propertyFeature.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log("Seed: criando usuário administrador...")
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bebianoimoveis.com.br"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "TrocarEssaSenha123"
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "ADMIN" },
  })

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash,
      roleId: adminRole.id,
    },
  })

  console.log(`Seed concluído. Login inicial: ${adminEmail}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
