import type {ComponentProps, ReactNode} from 'react'

import {Badge} from '@/client/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/client/components/ui/hover-card'
import {Marquee} from '@/client/components/ui/marquee'
import {cn} from '@/client/lib/utils'

import {getHexGradientStops} from '@qodestack/utils'
import {createFileRoute} from '@tanstack/react-router'
import {
  AtomIcon,
  CodeIcon,
  ContainerIcon,
  FileBracesCornerIcon,
  FileIcon,
  MonitorIcon,
  ServerIcon,
  SettingsIcon,
  TablePropertiesIcon,
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

      {/* GETTING STARTED */}
      <section className="prose prose-neutral dark:prose-invert mx-auto p-8 text-center">
        <h2>Getting Started</h2>
        <p className="text-justify">
          You've got a fullstack application here, ready to deploy! It's using
          all the goodies you see above in the scolling marquees. Obviously
          you've already figured out{' '}
          <Code className="whitespace-nowrap">bun dev</Code> starts the dev
          server. Here's a few helpful scripts when you're ready:
        </p>
        <ul className="text-left">
          <li>
            <Code>bun dev:local</Code> - starts the dev server on{' '}
            <Code>0.0.0.0</Code>, logging a local IP address accesible from any
            other device on your network.
          </li>
          <li>
            <Code>bun db:view</Code> - starts Drizzle Studio, a UI to explore
            your development database.
          </li>
          <li>
            <Code>bun dev:email</Code> - starts a local server where you can
            design your email templates used to send password reset, email
            change, etc.
          </li>
        </ul>
        <hr />
        <p className="text-center">
          You can sign into this demo app with 2 accounts:
        </p>
        <table className="mx-auto w-fit border-collapse border">
          <thead>
            <tr className="bg-secondary/50 font-bold">
              <td className="border px-2 py-1">Email</td>
              <td className="border px-2 py-1">Password</td>
            </tr>
          </thead>
          <tbody>
            <tr className="font-mono">
              <td className="border px-2 py-1">admin@example.com</td>
              <td className="border px-2 py-1">password</td>
            </tr>
            <tr className="font-mono">
              <td className="border px-2 py-1">user@example.com</td>
              <td className="border px-2 py-1">password</td>
            </tr>
          </tbody>
        </table>
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
          The Jotai store, TanStack router, and React Query client are all
          created here. The router context is populated and made available in
          all route loaders. An initial authentication check is made here and
          stored in <Code>isSignedInAtom</Code>.
        </FileCard>

        <FileCard
          fileName="router.tsx"
          description="Global settings for the router"
        >
          Configures global router defaults — preloading on intent, pending
          delay thresholds, a loading spinner via{' '}
          <Code>defaultPendingComponent</Code>, an error boundary via{' '}
          <Code>defaultErrorComponent</Code> (with error logging and
          retry/reset), and a 404 fallback.
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
                Full runtime theme manager. This takes over theme management
                once React mounts, syncing the user's preference to Jotai state
                and <Code>localStorage</Code> for persistence across reloads.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="<AppHeader />">
                Header component for this example app. Showcases how to access
                the current route. Also shows how to access the user's
                authentication state outside of the <Code>_authenticated</Code>{' '}
                route subtree.
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
          A few atoms to note (hover for description):
          <ul className="text-sm">
            <li>
              <HoverBadge text="authClientAtom">
                RPC for Better Auth endpoints. This will be used for signing in,
                signing out, and signing up new users. See Better Auth{' '}
                <ExternalLink href="https://www.better-auth.com/docs/authentication/email-password">
                  email & password
                </ExternalLink>{' '}
                docs.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="apiAuthClientAtom">
                RPC for custom authenticated endpoints. See the{' '}
                <Code>authRoutePath</Code> in <Code>honoServer.ts</Code>.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="apiClientAtom">
                RPC for custom public endpoints requiring no authentication.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="isSignedInAtom">
                Convenience atom that tracks if the user is signed in or not.
                Mainly used to track this status outside of the authenticated
                client route tree. Authenticated routes are
              </HoverBadge>
            </li>
          </ul>
        </FileCard>

        {/* _authenticated.tsx */}
        <FileCard
          fileName="_authenticated.tsx"
          description="Entrypoint for all authenticated routes"
        >
          {/* A layout route that wraps all routes found in the{' '}
          <Code>routes/_authenticated</Code> subtree. Its{' '}
          <Code>beforeLoad</Code> function checks authentication and redirects
          unauthenticated users so individual routes don't have to. */}
          A layout route (doesn't affect the URL) that houses all authenticated
          routes. Logic in the <Code>beforeLoad</Code> function checks
          authentication and redirects unauthenticated users so individual
          routes don't have to. All authenticated routes will go in the{' '}
          <Code>routes/_authenticated</Code> folder.
        </FileCard>

        <SectionHeading icon={<ServerIcon size={20} />}>Server</SectionHeading>

        {/* bunServer.ts */}
        <FileCard fileName="bunServer.ts" description="Server entry point">
          Bun is the server for this fullstack application both in development
          and production. Bun imports <Code>index.html</Code> and traversers the
          client-side dependecy graph from there. Bun uses the Hono server (see{' '}
          <Code>honoServer.ts</Code> for details) to handle api requests.
        </FileCard>

        {/* honoServer.ts */}
        <FileCard
          fileName="honoServer.ts"
          description="API layer and middleware stack"
        >
          Hono is used to drive API endpoints with middleware wired up.
          Unmatched routes fall back to <Code>index.html</Code> for client-side
          routing.
        </FileCard>

        {/* options.ts */}
        <FileCard fileName="options.ts" description="Better Auth configuration">
          Configures authentication — email/password with Arktype validation,
          passkeys, session cookie caching, admin roles, rate limiting, and
          email change verification via Resend.
        </FileCard>

        {/* appSchema.ts */}
        <FileCard fileName="appSchema.ts" description="Custom database tables">
          Define your Drizzle tables here. Ships with an{' '}
          <Code>errorsTable</Code> for logging client and server errors, plus a{' '}
          <Code>commonFields</Code> pattern for <Code>id</Code>,{' '}
          <Code>createdAt</Code>, and <Code>updatedAt</Code> fields.
        </FileCard>

        {/* authRoutes.ts */}
        <FileCard
          fileName="authRoutes.ts"
          description="Authenticated API endpoints"
        >
          Protected endpoints requiring a valid session via{' '}
          <Code>authMiddleware</Code>. Add your authenticated endpoints here.
          Session data is available on the Hono context.
        </FileCard>

        <SectionHeading icon={<WrenchIcon size={20} />}>
          Infrastructure
        </SectionHeading>

        {/* TypeScript Setup */}
        <FileCard
          fileName="TypeScript Setup"
          description="Dev environment orchestrator"
          iconJsx={<SettingsIcon size={iconSize} />}
        >
          There are multiple <Code>tsconfig</Code> files that work together to
          ensure <Code>/client</Code> and <Code>/server</Code> can't import from
          each other. <Code>/shared</Code> can be imported from both (hover for
          description):
          <ul className="text-sm">
            <li>
              <HoverBadge text="<root>/tsconfig.base.json">
                Settings that all other tsconfig files extend from.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="<root>/tsconfig.json">
                The main TypeScript config - wires together all the other
                tsconfigs.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="shared/tsconfig.json">
                Intentionally doesn't reference any other tsconfigs because it
                is only meant to be imported{' '}
                <span className="italic">from</span>.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="client/tsconfig.json">
                Prevents importing from server code. Can import from client and
                shared code.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="server/tsconfig.json">
                Prevents importing from client code. Can import from server and
                shared code.
              </HoverBadge>
            </li>
          </ul>
        </FileCard>

        {/* startDev.ts */}
        <FileCard
          fileName="startDev.ts"
          description="Dev environment orchestrator"
        >
          Starts the development server and related process, logs labeled
          messages from each process in a single terminal, and ensures all
          process are stopped together. Processes include:
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
          Primarily meant to be used by <Code>Dockerfile</Code> to build &
          containerize the application, you can also run this directly to build
          the app locally.
        </FileCard>

        {/* initDevDb.ts */}
        <FileCard
          fileName="initDevDb.ts"
          description="Initialize the local development database"
        >
          Runs the full DB setup pipeline: generates the Better Auth schema,
          creates Drizzle SQL migrations, applies them, and seeds the database
          with a default <Code>admin</Code> and <Code>user</Code> account.
        </FileCard>

        {/* Dockerfile */}
        <FileCard fileName="Dockerfile" description="Production Docker image">
          {/* Multi-stage build - compiles the app with Bun, sets up Drizzle Studio,
          then produces a minimal Alpine image with LiteFS for distributed
          SQLite replication. */}
          Dockerizes the app for easy deployment on{' '}
          <ExternalLink href="https://fly.io/">fly.io</ExternalLink>. You're
          ready to go with{' '}
          <ExternalLink href="https://fly.io/docs/litefs/">
            LightFS
          </ExternalLink>{' '}
          which <span className="font-mono text-xs">===</span> distributed
          SQLite. This also sets you up with Drizzle Studio{' '}
          <span className="italic">in production!</span>
        </FileCard>

        {/* Drizzle Studio */}
        <FileCard
          fileName="Drizzle Studio"
          description="UI to explore your database"
          iconJsx={
            <TablePropertiesIcon size={iconSize} className="-scale-x-100" />
          }
        >
          <p>
            <ExternalLink href="https://orm.drizzle.team/drizzle-studio/overview">
              Drizzle Studio
            </ExternalLink>{' '}
            is a UI that lets you explore and edit your database visually. There
            are local and production options. <Code>bun db:view</Code> runs
            Drizzle Studio <span className="italic">locally</span> and connects
            to your development database.
          </p>
          <p>
            Building the app with Docker will set up scripts to run Drizzle
            Studio in production, only accessible if you SSH into your
            production container and run them directly. See the below files for
            details:
          </p>
          <ul className="text-sm">
            <li>
              <HoverBadge text="drizzleStudioLocal.ts">
                Used to run Drizzle Studio against your development database
                locally.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="drizzleStudio.ts">
                See comments in this file for instructions on running Drizzle
                Studio against your production database via a{' '}
                <ExternalLink href="https://fly.io/docs/reference/fly-proxy/">
                  Fly.io proxy
                </ExternalLink>
                .
              </HoverBadge>
            </li>
          </ul>
        </FileCard>

        {/* constants.ts */}
        <FileCard
          fileName="constants.ts"
          description="Client, server, and shared constants"
        >
          3 files containing constants (hover for description):
          <ul className="text-sm">
            <li>
              <HoverBadge text="client/constants.ts">
                Constants only available within the <Code>/client</Code> folder.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="server/constants.ts">
                Constants only available within the <Code>/server</Code> folder.
              </HoverBadge>
            </li>
            <li>
              <HoverBadge text="shared/constants.ts">
                Constants available from anywhere in the application.
              </HoverBadge>
            </li>
          </ul>
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
    tech: 'Resend',
    description:
      'Powered by React Email, this makes email integration a breeze.',
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
  toml: <FileIcon size={iconSize} />,
  // biome-ignore lint/style/useNamingConvention: keys are file extensions
  Dockerfile: <ContainerIcon size={iconSize} />,
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
