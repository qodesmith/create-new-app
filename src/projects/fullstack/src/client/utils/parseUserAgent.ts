export type ParsedUserAgent = {
  browser: string
  os: string
  device: 'mobile' | 'tablet' | 'desktop'
  raw: string
}

type Rule = {pattern: RegExp; name: string}

const browserRules: Rule[] = [
  {pattern: /Edg\/([\d.]+)/, name: 'Edge'},
  {pattern: /OPR\/([\d.]+)|Opera\/([\d.]+)/, name: 'Opera'},
  {pattern: /Firefox\/([\d.]+)/, name: 'Firefox'},
  {pattern: /Chrome\/([\d.]+)/, name: 'Chrome'},
  {pattern: /Version\/([\d.]+).*Safari/, name: 'Safari'},
  {pattern: /Safari\/([\d.]+)/, name: 'Safari'},
]

const osRules: Rule[] = [
  {pattern: /Windows NT 10\.0/, name: 'Windows 10/11'},
  {pattern: /Windows NT ([\d.]+)/, name: 'Windows'},
  {pattern: /Mac OS X ([\d_.]+)/, name: 'macOS'},
  {pattern: /Android ([\d.]+)/, name: 'Android'},
  {pattern: /(iPhone|iPad|iPod).*OS ([\d_]+)/, name: 'iOS'},
  {pattern: /CrOS/, name: 'ChromeOS'},
  {pattern: /Linux/, name: 'Linux'},
]

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  const raw = ua ?? ''

  if (!raw.trim()) {
    return {browser: 'Unknown', os: 'Unknown', device: 'desktop', raw}
  }

  let browser = 'Unknown'
  for (const {pattern, name} of browserRules) {
    if (pattern.test(raw)) {
      browser = name
      break
    }
  }

  let os = 'Unknown'
  for (const {pattern, name} of osRules) {
    if (pattern.test(raw)) {
      os = name
      break
    }
  }

  let device: ParsedUserAgent['device'] = 'desktop'
  if (/iPad|Tablet/i.test(raw)) {
    device = 'tablet'
  } else if (/Mobi|iPhone|iPod|Android.*Mobile/i.test(raw)) {
    device = 'mobile'
  }

  return {browser, os, device, raw}
}
