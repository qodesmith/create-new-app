import type {ComponentProps} from 'react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/client/components/ui/hover-card'
import {Marquee} from '@/client/components/ui/marquee'

import {getHexGradientStops} from '@qodestack/utils'
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const appName = '{{PROJECT_NAME}}'
  const cyan400 = '#00d3f3'
  const fuchsia500 = '#e12afb'
  const appNameColorStops = getHexGradientStops({
    startColor: cyan400,
    endColor: fuchsia500,
    stops: appName.length,
  })

  return (
    <section className="prose prose-neutral dark:prose-invert h-full max-w-none p-4">
      <div>
        <h1 className="flex justify-center gap-3">
          {appName.split('').map((letter, i) => {
            const color = appNameColorStops[i]

            return (
              <span key={i + letter} style={{color}}>
                {letter}
              </span>
            )
          })}
        </h1>
        <p className="text-center text-sm italic">
          Brought to you by{' '}
          <a href="https://github.com/qodesmith/create-new-app">
            Create New App
          </a>
        </p>
      </div>

      <Marquee pauseOnHover>
        {techUsed.map(({tech, description}) => {
          return (
            <TechCard
              key={tech}
              tech={tech}
              description={description}
              side="top"
            />
          )
        })}
      </Marquee>

      <Marquee pauseOnHover reverse>
        {techUsed.map(({tech, description}) => {
          return (
            <TechCard
              key={tech}
              tech={tech}
              description={description}
              side="bottom"
            />
          )
        })}
      </Marquee>
    </section>
  )
}

const techUsed = [
  {
    tech: 'React',
    description: 'Still king. Nuff said.',
  },
  {
    tech: 'Tanstack Router',
    description: `It's ${new Date().getFullYear()}. Just use Tanstack Router.`,
  },
  {
    tech: 'Tailwind',
    description:
      "CSS utility classes that you'll wonder how you lived without.",
  },
  {
    tech: 'Shadcn',
    description:
      'A one-way trip down the rabbit hole of components. Welcome to wonderland.',
  },
  {
    tech: 'Jotai',
    description:
      "The best state management library for React. Like, it's not even close.",
  },
  {
    tech: 'Bun',
    description: 'Bun can beat up your JavaScript runtime.',
  },
  {
    tech: 'Hono',
    description: 'Chefs kiss of backend frameworks.',
  },
  {
    tech: 'SQLite',
    description: 'A file is your database. Absolutely life changing.',
  },
  {
    tech: 'Drizzle',
    description: 'Because who wants to write raw SQL? Drizzle rules.',
  },
  {
    tech: 'Better Auth',
    description:
      "Don't roll your own auth, bruh. Better Auth is just... better.",
  },
  {
    tech: 'Arkytpe',
    description:
      'Prepare to have your mind blown by defining schema types with plain strings.',
  },
  {
    tech: '@qodestack',
    description:
      'Homegrown utilities. Because sometimes you just gotta build it yourself.',
  },
]

function TechCard({
  tech,
  description,
  side,
}: {
  tech: string
  description: string
  side?: ComponentProps<typeof HoverCardContent>['side']
}) {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className="rounded-sm border border-border px-4 py-1 text-current/50 transition-all hover:border-cyan-400/50 hover:bg-cyan-950/35 hover:text-primary">
          {tech}
        </div>
      </HoverCardTrigger>
      <HoverCardContent side={side} className="p-2 text-center text-sm">
        {description}
      </HoverCardContent>
    </HoverCard>
  )
}
