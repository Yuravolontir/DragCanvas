// ═══════════════════════════════════════════════════════════════
// Login - Страница входа
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext-example';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // Функция логина из AuthContext
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    console.log('🔐 Юзер нажал "Войти"', { email, password });

    // 📋 ТЕСТОВЫЕ ДАННЫЕ (пока без бэкенда!)
    // В реальном проекте здесь будет fetch() к бэкенду

    // Вариант 1: Успешный логин
    if (email === 'test@test.com' && password === '123456') {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        name: 'Alex'
      };

      console.log('✅ Пароль верный! Логиню...');

      // 🔑 Вызываем login из AuthContext
      login(mockUser);

      // 🏠 Перенаправляем на главную
      navigate('/');
    } else {
      // Вариант 2: Неверный пароль
      console.log('❌ Неверный email или пароль!');
      alert('Неверный email или пароль! Попробуй: test@test.com / 123456');
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🔐 Страница входа</h1>

      <form onSubmit={handleLogin} style={{ maxWidth: '300px', margin: '0 auto' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@test.com"
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="123456"
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Войти
        </button>
      </form>

      <p style={{ marginTop: '20px', color: '#666' }}>
        💡 Тестовый аккаунт: <strong>test@test.com</strong> / <strong>123456</strong>
      </p>
    </div>
  );
}

export default Login;
