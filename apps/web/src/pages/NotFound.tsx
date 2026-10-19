import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="mt-2 text-sm text-shelf-400">
        Esta seccion todavia no existe.
      </p>
      <Link to="/" className="btn btn-primary mt-6">
        Volver al estado
      </Link>
    </div>
  )
}