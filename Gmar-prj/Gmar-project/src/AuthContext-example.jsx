// ═══════════════════════════════════════════════════════════════
// AuthContext - "Хранилище текущего пользователя"
// ═══════════════════════════════════════════════════════════════

import { createContext, useState, useEffect, useContext } from 'react';

// 1️⃣ СОЗДАЁМ КОНТЕКСТ (пустой коробка для данных)
export const AuthContext = createContext(null);

// 2️⃣ AuthProvider - "Компонент-обёртка" который даёт данные всем детям
export function AuthProvider({ children }) {

  // 🔵 СОСТОЯНИЕ: кто сейчас залогинен?
  // null = никто не залогинен
  // { id, email, name } = кто-то залогинен
  const [user, setUser] = useState(null);

  // 🟡 ПРИ ЗАГРУЗКЕ: проверяем localStorage (не базу данных!)
  useEffect(() => {
    console.log('🔍 AuthContext: Проверяю localStorage...');

    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('✅ Нашёл юзера в localStorage:', parsedUser);
      setUser(parsedUser); // Восстанавливаем из памяти браузера
    } else {
      console.log('❌ Юзер не найден в localStorage');
    }
  }, []);

  // 🟢 ФУНКЦИЯ ЛОГИНА: вызывается когда юзер нажимает "Войти"
  const login = (userData) => {
    console.log('🔐 Логиню юзера:', userData);

    // 1. Сохраняем в состояние (память приложения)
    setUser(userData);

    // 2. Сохраняем в localStorage (память браузера)
    localStorage.setItem('user', JSON.stringify(userData));

    console.log('✅ Юзер залогинен и сохранён!');
  };

  // 🔴 ФУНКЦИЯ ЛОГАУТА: вызывается когда юзер нажимает "Выйти"
  const logout = () => {
    console.log('🚪 Логаутю юзера...');

    // 1. Очищаем состояние
    setUser(null);

    // 2. Очищаем localStorage
    localStorage.removeItem('user');

    console.log('✅ Юзер разлогинен!');
  };

  // 3️⃣ ПРЕДОСТАВЛЯЕМ ДАННЫЕ ВСЕМ ДЕТЯМ
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4️⃣ ХУК для удобного использования в компонентах
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider!');
  }
  return context;
}
