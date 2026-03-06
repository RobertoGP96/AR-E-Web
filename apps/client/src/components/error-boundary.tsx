import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack)
  }

  private handleRetry = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    const isDev = import.meta.env.DEV

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-4 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </span>
          </div>

          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Algo salió mal
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Ocurrió un error inesperado. Por favor, intenta recargar la página.
          </p>

          <button
            onClick={this.handleRetry}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reintentar
          </button>

          {isDev && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Detalles del error (solo en desarrollo)
              </summary>
              <div className="mt-3 space-y-2">
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs text-destructive">
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <pre className="overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
