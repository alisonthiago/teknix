import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const siteDist = path.join(rootDir, 'apps/site/dist')
const hubDist = path.join(rootDir, 'apps/hub/dist')
const outputDir = path.join(rootDir, 'dist_deploy')

console.log('--- Preparando pasta unificada de deploy multi-domínio ---')

// 1. Limpa outputDir se existir
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true })
}
fs.mkdirSync(outputDir, { recursive: true })

// 2. Copia todo o apps/site/dist para a raiz de dist_deploy
if (fs.existsSync(siteDist)) {
  console.log('Copiando build do SITE para dist_deploy...')
  fs.cpSync(siteDist, outputDir, { recursive: true })
} else {
  console.error('ERRO: Diretório apps/site/dist não encontrado!')
  process.exit(1)
}

// 3. Copia todo o apps/hub/dist para dist_deploy/hub
const hubTarget = path.join(outputDir, 'hub')
if (fs.existsSync(hubDist)) {
  console.log('Copiando build do HUB para dist_deploy/hub...')
  fs.mkdirSync(hubTarget, { recursive: true })
  fs.cpSync(hubDist, hubTarget, { recursive: true })
} else {
  console.error('ERRO: Diretório apps/hub/dist não encontrado!')
  process.exit(1)
}

console.log('✓ Pasta dist_deploy pronta com SITE (raiz) e HUB (/hub)!')
