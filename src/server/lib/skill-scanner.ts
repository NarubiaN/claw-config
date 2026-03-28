import fs from 'fs'
import path from 'path'
import os from 'os'
import 'dotenv/config'

export interface DiscoveredSkill {
  name: string
  description: string
  type: 'claude' | 'openclaw'
  path: string
  dirName: string
  allowedTools?: string[]
}

const SKILL_DIRS: Array<{ dir: string; type: 'claude' | 'openclaw' }> = [
  { dir: process.env.CLAUDE_SKILLS_PATH ?? path.join(os.homedir(), '.claude', 'skills'), type: 'claude' },
  { dir: process.env.OPENCLAW_SKILLS_PATH ?? path.join(os.homedir(), '.openclaw', 'skills'), type: 'openclaw' },
  { dir: path.join(os.homedir(), '.openclaw', 'workspace', 'skills'), type: 'openclaw' },
  { dir: path.join(os.homedir(), 'Documents', 'DrillClaw', 'skills'), type: 'openclaw' },
]

export interface SkillScanResult {
  claude: DiscoveredSkill[]
  openclaw: DiscoveredSkill[]
}

export function scanSkills(): SkillScanResult {
  const result: SkillScanResult = { claude: [], openclaw: [] }

  for (const { dir, type } of SKILL_DIRS) {
    if (!fs.existsSync(dir)) continue

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillDir = path.join(dir, entry.name)
      const skillMdPath = path.join(skillDir, 'SKILL.md')

      if (!fs.existsSync(skillMdPath)) continue

      try {
        const content = fs.readFileSync(skillMdPath, 'utf-8')
        const skill = parseSkillMd(content, entry.name, type, skillDir)
        result[type].push(skill)
      } catch {
        // Skip unreadable skill files
      }
    }
  }

  // Deduplicate by dirName within each type
  result.claude = dedupeSkills(result.claude)
  result.openclaw = dedupeSkills(result.openclaw)

  return result
}

function dedupeSkills(skills: DiscoveredSkill[]): DiscoveredSkill[] {
  const seen = new Set<string>()
  return skills.filter(s => {
    if (seen.has(s.dirName)) return false
    seen.add(s.dirName)
    return true
  })
}

function parseSkillMd(
  content: string,
  dirName: string,
  type: 'claude' | 'openclaw',
  skillPath: string
): DiscoveredSkill {
  // Try to extract YAML frontmatter (--- ... ---)
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  let name = dirName
  let description = ''
  let allowedTools: string[] | undefined

  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1]

    // Extract name field
    const nameMatch = yaml.match(/^name:\s*(.+)$/m)
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/^["']|["']$/g, '')
    }

    // Extract description field
    const descMatch = yaml.match(/^description:\s*(.+)$/m)
    if (descMatch) {
      description = descMatch[1].trim().replace(/^["']|["']$/g, '')
    }

    // Extract allowed-tools field (JSON array string in frontmatter)
    const toolsMatch = yaml.match(/^allowed-tools:\s*(.+)$/m)
    if (toolsMatch) {
      try {
        const parsed = JSON.parse(toolsMatch[1].trim())
        if (Array.isArray(parsed)) {
          allowedTools = parsed
        }
      } catch {
        // Invalid JSON — skip
      }
    }
  }

  // If no description from frontmatter, grab first non-empty paragraph after frontmatter
  if (!description) {
    const afterFrontmatter = content.replace(/^---[\s\S]*?---\s*\n/, '')
    const firstParagraph = afterFrontmatter
      .split('\n\n')
      .find(p => p.trim() && !p.startsWith('#'))
    if (firstParagraph) {
      description = firstParagraph.trim().slice(0, 200)
    }
  }

  // If still no name from frontmatter, try first H1
  if (name === dirName) {
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) {
      name = h1Match[1].trim()
    }
  }

  return { name, description, type, path: skillPath, dirName, ...(allowedTools && { allowedTools }) }
}
