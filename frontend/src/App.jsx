import { RouterProvider } from "react-router-dom";
import router from "@/router/Index.jsx";
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { NotificationProvider } from './context/NotificationContext'



function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </PreferencesProvider>
    </AuthProvider>
  )
}

export default App
