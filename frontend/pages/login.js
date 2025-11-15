import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_BASE = 'http://localhost:8080';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        username,
        password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push('/');
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,215,0,0.3)',
        width: '400px'
      }}>
        <h1 style={{ 
          color: '#ffd700', 
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          ⚗️ Acceso al Sistema
        </h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
              Usuario:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#ff6b6b', 
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#ffd700',
              color: 'black',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔐 Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', color: 'white' }}>
          <p>Usuarios de prueba:</p>
          <p><strong>edward_elric</strong> / password123 (Alquimista)</p>
          <p><strong>roy_mustang</strong> / password123 (Supervisor)</p>
          <p><strong>admin</strong> / password123 (Admin)</p>
        </div>
      </div>
    </div>
  );
}