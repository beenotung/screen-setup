import { array, int, object, string } from 'cast.ts'
import { execSync } from 'child_process'
import { getLocalStorage } from '@beenotung/tslib/store'

export type Configs = Config[]

export type Config = {
  profile_name: string
  screens: Screen[]
}

export type Screen = {
  name: string
  w: number
  h: number
  x: number
  y: number
}

let screenParser = object({
  name: string({ nonEmpty: true }),
  w: int(),
  h: int(),
  x: int(),
  y: int(),
})

let configParser = object({
  profile_name: string({ nonEmpty: true }),
  screens: array(screenParser),
})

let configsParser = array(configParser)

export function getCurrentConfig(): Config {
  let screens: Screen[] = []
  let text = execSync('xrandr').toString()
  let matches = text.matchAll(/\w+ connected (primary )?([\dx+]+)/g)

  for (let match of matches) {
    let name = match[0].match(/\w+/)?.[0]
    let [_, w, h, x, y] = match[0].match(/(\d+)x(\d+)\+(\d+)\+(\d+)/) || []
    let screen = screenParser.parse({ name, w, h, x, y })
    screens.push(screen)
  }
  return { profile_name: 'current', screens }
}

let storage = getLocalStorage('.db')

export function loadConfigs(): Configs {
  try {
    return configsParser.parse(JSON.parse(storage.getItem('configs') || ''))
  } catch (error) {
    return []
  }
}

export function saveConfigs(configs: Configs) {
  let text = JSON.stringify(configsParser.parse(configs), null, 2)
  storage.setItem('configs', text)
}
