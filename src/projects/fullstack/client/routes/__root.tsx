import { createRootRoute, createRoute, Outlet, Link } from '@tanstack/react-router'

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link
                to="/"
                className="text-gray-900 font-semibold text-lg"
              >
                {{PROJECT_NAME}}
              </Link>
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
                activeProps={{ className: 'text-blue-600' }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
                activeProps={{ className: 'text-blue-600' }}
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  ),
})

// Home page
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to {{PROJECT_NAME}}
      </h1>
      <p className="text-lg text-gray-600">
        A fullstack React application powered by Bun
      </p>
    </div>
  ),
})

// About page
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => (
    <div className="prose mx-auto">
      <h1>About</h1>
      <p>
        This project was generated with create-new-app and includes:
      </p>
      <ul>
        <li>React + Tanstack Router</li>
        <li>Bun + Hono backend</li>
        <li>SQLite + Drizzle ORM</li>
        <li>Tailwind CSS</li>
      </ul>
    </div>
  ),
})

// Export route tree
export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])
