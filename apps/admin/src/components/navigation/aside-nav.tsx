import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  Bell,
  Search,
  User2,
} from "lucide-react"

// Navigation items configuration
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Users",
    url: "/users", 
    icon: Users,
    badge: "12",
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    badge: "24",
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    badge: "3",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

// Projects or secondary navigation
const projects = [
  {
    name: "Analytics",
    url: "/analytics",
    icon: LayoutDashboard,
  },
  {
    name: "Reports",
    url: "/reports", 
    icon: Package,
  },
  {
    name: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
]

export function AsideNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigation = (url: string) => {
    navigate(url)
  }

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">Gestión</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Navegación Principal
          </div>
          {navigationItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleNavigation(item.url)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.url
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Proyectos
          </div>
          {projects.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.url)}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <User2 className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
