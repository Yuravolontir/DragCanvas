// ═══════════════════════════════════════════════════════════════
// App-example - Как ВСЁ соединяется вместе
// ═══════════════════════════════════════════════════════════════

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext-example';
import ProtectedRoute from './ProtectedRoute-example';
import Login from './Login-example';
import CreateNewProject from './CreateNewProject';

// ───────────────────────────────────────────────────────────────
// 📊 ПАНЕЛЬ СТАТУСА (показывает кто залогинен прямо в приложении)
// ───────────────────────────────────────────────────────────────
function StatusBar() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      background: user ? '#28a745' : '#dc3545',
      color: 'white',
      padding: '10px',
      textAlign: 'center'
    }}>
      {user ? (
        <span>
          ✅ Залогинен как: <strong>{user.email}</strong>
          <button
            onClick={logout}
            style={{
              marginLeft: '20px',
              padding: '5px 15px',
              background: 'white',
              color: '#dc3545',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Выйти
          </button>
        </span>
      ) : (
        <span>❌ Не залогинен</span>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 🏠 ГЛАВНАЯ СТРАНИЦА
// ───────────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🏠 Добро пожаловать!</h1>
      <p>Текущий статус: <strong>{user ? 'Залогинен' : 'Не залогинен'}</strong></p>
      <a href="/create-new-project" style={{ color: '#007bff' }}>
        🔗 Создать новый проект
      </a>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 🛠️ СОЗДАТЬ ПРОЕКТ (ЗАЩИЩЁННАЯ СТРАНИЦА!)
// ───────────────────────────────────────────────────────────────
function CreateNewProject() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🛠️ Создать новый проект</h1>
      <p>🎉 Ты видишь эту страницу значит ТЫ ЗАЛОГИНЕН!</p>
      <p style={{ color: '#28a745' }}>✅ ProtectedRoute пропустил тебя!</p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 🚦 РОУТЕР (все пути приложения)
// ───────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    // 🔒 ЗАЩИЩЁННЫЙ РОУТ!
    path: "/create-new-project",
    element: (
      <ProtectedRoute>
        <CreateNewProject />
      </ProtectedRoute>
    ),
  },
]);

// ───────────────────────────────────────────────────────────────
// 🎯 ГЛАВНЫЙ КОМПОНЕНТ APP
// ───────────────────────────────────────────────────────────────
function AppExample() {

  console.log('🚀 App запускается...');

  return (
    // 🔑 AuthProvider ДОЛЖЕН ОБЪЁМЫВАТЬ ВСЁ!
    <AuthProvider>
      <StatusBar />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default AppExample;
