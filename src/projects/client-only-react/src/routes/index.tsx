import type {ComponentProps, ReactNode} from 'react'

import {SonarPulse} from '@/components/custom/SonarPulse'
import {Badge} from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {Marquee} from '@/components/ui/marquee'
import {cn} from '@/lib/utils'

import {getHexGradientStops} from '@qodestack/utils'
import {createFileRoute} from '@tanstack/react-router'
import {
  AtomIcon,
  CodeIcon,
  FileBracesCornerIcon,
  MonitorIcon,
  SettingsIcon,
  WrenchIcon,
} from 'lucide-react'

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
  const happyCoding = 'Happy coding!'
  const happyCodingColorStops = getHexGradientStops({
    startColor: cyan400,
    endColor: fuchsia500,
    stops: happyCoding.length,
  })

  return (
    <>
      {/* TECH MARQUEES */}
      <section className="prose prose-neutral dark:prose-invert max-w-none">
        <div>
          <h1 className="flex justify-center gap-3">
            {appName.split('').map((letter, i) => {
              const color = appNameColorStops[i]
              const key = `${i}${letter}`

              return (
                <span key={key} style={{color}}>
                  {letter}
                </span>
              )
            })}
          </h1>
          <p className="flex items-center justify-center gap-1.5 text-sm italic">
            <SonarPulse />
            Brought to you by
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

      {/* GETTING STARTED */}
      <section className="prose prose-neutral dark:prose-invert mx-auto p-8 text-center">
        <h2>Getting Started</h2>
        <p className="text-justify">
          You've got a client-only React SPA here, ready to go! It's using all
          the goodies you see above in the scrolling marquees. Obviously you've
          already figured out <Code className="whitespace-nowrap">bun dev</Code>{' '}
          starts the dev server. Here's a few helpful scripts:
        </p>
        <ul className="text-left">
          <li>
            <Code>bun dev:all</Code> - starts the dev server on{' '}
            <Code>0.0.0.0</Code>, logging a local IP address accessible from any
            other device on your network.
          </li>
          <li>
            <Code>bun run build.ts</Code> - builds the application for
            production.
          </li>
          <li>
            <Code>bun knip</Code> - checks for unused code and dependencies.
          </li>
        </ul>
        <hr />
        <p className="text-justify">
          Below are files you may want to familiarize yourself with that
          highlight the inner workings of this app.{' '}
          {happyCoding.split('').map((letter, i) => {
            const color = happyCodingColorStops[i]
            const key = `${i}${letter}`

            return (
              <span key={key} style={{color}} className="italic">
                {letter}
              </span>
            )
          })}
        </p>
      </section>

      {/* FILE DESCRIPTIONS */}
      <section className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 lg:grid-cols-3">
        <SectionHeading icon={<MonitorIcon size={20} />}>Client</SectionHeading>

        {/* index.html */}
        <FileCard fileName="index.html" description="Application entrypoint">
          Bun will import this file, traversing the dependency graph, and serve
          the app. This file contains an{' '}
          <span className="italic">inline script</span> which sets the initial
          theme. This is a standard way to avoid FOUC (flash of unstyled
          content). The theme is stored in <Code>localStorage</Code> under the
          key <Code>ui-theme</Code>, and synced with the{' '}
          <Code>themeSettingAtom</Code>.
        </FileCard>

        {/* app.tsx */}
        <FileCard
          fileName="app.tsx"
          description="React application mount point"
        >
          The Jotai store, TanStack router, and TanStack Query client are all
          created here. The router context is populated and made available in
          all route loaders.
        </FileCard>

        <FileCard
          fileName="router.tsx"
          description="Global settings for the router"
        >
          Configures global router defaults — preloading on intent, pending
          delay thresholds, a loading spinner via{' '}
          <Code>defaultPendingComponent</Code>, an error boundary via{' '}
          <Code>defaultErrorComponent</Code> (with retry/reset), and a 404
          fallback.
        </FileCard>

        {/* __root.tsx */}
        <FileCard
          fileName="__root.tsx"
          description="Top-level component for TanStack Router"
        >
          Content rendered here will show on every page. A few things rendered
          (hover for description):
          <ul className="text-sm">
            <li>
              <HoverBadge text="<Toaster />">
                A container for the toasts. See the{' '}
                <ExternalLink href="https://ui.shadcn.com/docs/components/radix/sonner">
                  Sonner
                </ExternalLink>{' '}
                docs for more info.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="<ThemeSetter />">
                Runtime theme manager. Pairs with the inline script in{' '}
                <Code>index.html</Code> — reads <Code>themeSettingAtom</Code>,
                resolves <Code>system</Code> to the actual <Code>light</Code>/
                <Code>dark</Code> value, and applies the matching class to{' '}
                <Code>&lt;html&gt;</Code>. <Code>localStorage</Code> persistence
                is handled by <Code>themeSettingAtom</Code> via{' '}
                <Code>atomWithStorage</Code>.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="<AppHeader />">
                Header component for this example app. Showcases how to access
                the current route.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="<TanStackRouterDevtools />">
                Renders{' '}
                <ExternalLink href="https://tanstack.com/router/latest/docs/framework/react/devtools">
                  TanStack Router's devtools
                </ExternalLink>{' '}
                on the screen. This component will automatically be excluded
                from production builds.
              </HoverBadge>
            </li>
          </ul>
        </FileCard>

        {/* globalState.ts */}
        <FileCard fileName="globalState.ts" description="Global jotai state">
          Theme-related atoms (hover for description):
          <ul className="text-sm">
            <li>
              <HoverBadge text="themeSettingAtom">
                Tracks the user's theme preference (<Code>light</Code>,{' '}
                <Code>dark</Code>, or <Code>system</Code>). Persisted in{' '}
                <Code>localStorage</Code>.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="themeSelector">
                Derived atom that resolves to the actual current theme (
                <Code>light</Code> or <Code>dark</Code>).
              </HoverBadge>
            </li>
          </ul>
        </FileCard>

        <SectionHeading icon={<WrenchIcon size={20} />}>
          Infrastructure
        </SectionHeading>

        {/* TypeScript Setup */}
        <FileCard
          fileName="TypeScript Setup"
          description="TypeScript configuration"
          iconJsx={<SettingsIcon size={iconSize} />}
        >
          A single <Code>tsconfig.json</Code> handles the whole project. The
          path alias <Code>@/*</Code> maps to <Code>./src/*</Code> for clean
          imports.
        </FileCard>

        {/* biome.jsonc */}
        <FileCard
          fileName="biome.jsonc"
          description="Linter and formatter"
          iconJsx={<SettingsIcon size={iconSize} />}
        >
          Biome handles lint and format in one tool, extending{' '}
          <Code>@qodestack/biome-config/react</Code>. A few project-specific
          rules are configured (hover for description):
          <ul className="text-sm">
            <li>
              <HoverBadge text="ignored generated files">
                <Code>src/routeTree.gen.ts</Code> (TanStack Router) and the{' '}
                <Code>dist</Code> build output are excluded from linting since
                they're regenerated.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="useStable hook hint">
                <Code>useExhaustiveDependencies</Code> is taught about the
                custom <Code>useStable</Code> hook so it doesn't flag stable
                results as missing dependencies.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="contextual overrides">
                TanStack route files and Shadcn components opt out of{' '}
                <Code>useComponentExportOnlyModules</Code> so they can export
                non-component values. Shadcn UI primitives opt out of{' '}
                <Code>noArrayIndexKey</Code>.
              </HoverBadge>
            </li>
          </ul>
        </FileCard>

        {/* startDev.ts */}
        <FileCard
          fileName="startDev.ts"
          description="Dev environment orchestrator"
        >
          Starts the development server and related processes, logs labeled
          messages from each process in a single terminal, and ensures all
          processes are stopped together. Processes include:
          <ul className="text-sm">
            <li>Bun development server</li>
            <li>TanStack Router routes file watcher</li>
            <li>
              Opens <Code>localhost</Code> when the dev server and TSR are ready
            </li>
          </ul>
        </FileCard>

        {/* build.ts */}
        <FileCard fileName="build.ts" description="Production build script">
          Bundles the application for production with code splitting,
          minification, and sourcemaps. Run directly with{' '}
          <Code>bun run build.ts</Code>.
        </FileCard>
      </section>
    </>
  )
}

const techUsed = [
  {
    tech: 'React',
    description: 'Still king. Nuff said.',
  },
  {
    tech: 'TanStack Router',
    description: `It's ${new Date().getFullYear()}. Just use TanStack Router.`,
  },
  {
    tech: 'TanStack Query',
    description: 'The fetch GOAT.',
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
    <HoverCard openDelay={0} closeDelay={50}>
      <HoverCardTrigger asChild>
        <div className="rounded-sm border border-border px-4 py-1 text-current/50 transition-all hover:border-cyan-400/50 hover:bg-cyan-950/35 hover:text-primary">
          {tech}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        className="bg-background/50 p-2 text-center text-sm backdrop-blur-xs"
      >
        {description}
      </HoverCardContent>
    </HoverCard>
  )
}

const iconSize = 16
const icons: Record<string, ReactNode> = {
  html: <CodeIcon size={iconSize} />,
  tsx: <AtomIcon size={iconSize} />,
  ts: <FileBracesCornerIcon size={iconSize} />,
}

function FileCard({
  fileName,
  description,
  children,
  iconJsx,
}: {
  fileName: string
  description: ReactNode
  children: ReactNode
  iconJsx?: ReactNode
}) {
  const ext = fileName.split('.').pop() ?? ''
  const icon = iconJsx ?? icons[ext]

  return (
    <Card className="transition-colors hover:border-fuchsia-500 dark:hover:border-cyan-400">
      <CardHeader>
        <CardTitle className="flex items-end gap-2">
          {icon}
          {fileName}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert prose-neutral max-w-none">
        {children}
      </CardContent>
    </Card>
  )
}

function HoverBadge({
  text,
  children,
  side,
}: {
  text: string
  children: ReactNode
  side?: ComponentProps<typeof HoverCardContent>['side']
}) {
  return (
    <HoverCard openDelay={0} closeDelay={50}>
      <HoverCardTrigger asChild>
        <Badge variant="outline">{text}</Badge>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        className="bg-background/50 px-4 py-2 text-sm backdrop-blur-xs"
      >
        {children}
      </HoverCardContent>
    </HoverCard>
  )
}

function ExternalLink({href, children}: {href: string; children: ReactNode}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 no-underline hover:underline"
    >
      {children}
    </a>
  )
}

function SectionHeading({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="prose prose-neutral dark:prose-invert col-span-full max-w-none border-b">
      <h2 className="flex items-center gap-4">
        {icon}
        {children}
      </h2>
    </div>
  )
}

function Code({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'rounded font-bold font-mono text-fuchsia-500 text-xs dark:text-cyan-400',
        className
      )}
    >
      {children}
    </span>
  )
}
