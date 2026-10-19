import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { SessionProvider } from './components/SessionProvider'
import { RequireSession } from './components/RequireSession'
import { StatusPage } from './pages/Status'
import { LoginPage } from './pages/Login'
import { BibliotecaPage } from './pages/Biblioteca'
import { BuscarPage } from './pages/Buscar'
import { CompararPage } from './pages/Comparar'
import { NotFoundPage } from './pages/NotFound'
import './index.css'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <StatusPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/biblioteca',
        element: (
          <RequireSession>
            <BibliotecaPage />
          </RequireSession>
        ),
      },
      { path: '/buscar', element: <BuscarPage /> },
      { path: '/comparar', element: <CompararPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root en index.html')

createRoot(root).render(
  <StrictMode>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </StrictMode>,
)
