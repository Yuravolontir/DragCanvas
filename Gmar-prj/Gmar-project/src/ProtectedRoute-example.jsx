// ═══════════════════════════════════════════════════════════════
// ProtectedRoute - "Охранник" защищённых страниц
// ═══════════════════════════════════════════════════════════════

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext-example';

// 🛡️ Этот компонент ПРОВЕРЯЕТ: залогинен ли юзер?
// Если нет → отправляет на страницу логина
// Если да → показывает защищённую страницу

function ProtectedRoute({ children }) {

  // 1️⃣ БЕРЁМ ЮЗЕРА ИЗ AuthContext (НЕ из базы!)
  const { user } = useAuth();

  console.log('🛡️ ProtectedRoute: Проверяю юзера...', user);

  // 2️⃣ ЕСЛИ ЮЗЕРА НЕТ → редирект на /login
  if (!user) {
    console.log('❌ Юзера нет! Редирект на /login');
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ ЕСЛИ ЮЗЕР ЕСТЬ → показываем страницу
  console.log('✅ Юзер есть! Показываю страницу');
  return children;
}

export default ProtectedRoute;
