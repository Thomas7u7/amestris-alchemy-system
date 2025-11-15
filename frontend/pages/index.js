import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const API_BASE = 'http://localhost:8080';

export  function AmestrisAlchemySystem() {
  const [alchemists, setAlchemists] = useState([]);
  const [missions, setMissions] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Configuración de axios con interceptor de auth
  const authApi = axios.create({ baseURL: API_BASE });
  authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) setUser(JSON.parse(userData));
    await fetchInitialData();
    setLoading(false);
  };

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchAlchemists(),
        fetchMissions(),
        fetchExperiments(),
        fetchMaterials(),
        fetchAuditLogs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) handleLogout();
    }
  };

  const fetchAlchemists = async () => {
    const response = await authApi.get('/api/alchemists');
    setAlchemists(response.data);
  };

  const fetchMissions = async () => {
    const response = await authApi.get('/api/missions');
    setMissions(response.data);
  };

  const fetchExperiments = async () => {
    const response = await authApi.get('/api/experiments');
    setExperiments(response.data);
  };

  const fetchMaterials = async () => {
    const response = await authApi.get('/api/materials');
    setMaterials(response.data);
  };

  const fetchAuditLogs = async () => {
    const response = await authApi.get('/api/audit-logs');
    setAuditLogs(response.data);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="app-container">
      <Header user={user} onLogout={handleLogout} />
      
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
       <main className="main-content">
        {activeTab === 'dashboard' && <DashboardSection user={user} data={{ alchemists, missions, experiments, auditLogs }} />}
        {activeTab === 'alchemists' && <AlchemistsSection alchemists={alchemists} userRole={user.role} onRefresh={fetchAlchemists} />}
        {activeTab === 'missions' && <MissionsSection missions={missions} userRole={user.role} onRefresh={fetchMissions} alchemists={alchemists} />}
        {activeTab === 'experiments' && <ExperimentsSection experiments={experiments} userRole={user.role} onRefresh={fetchExperiments} />}
        {activeTab === 'transmutations' && <TransmutationSection materials={materials} onTransmute={fetchAuditLogs} />} {/* ← Pasa materials aquí */}
        {activeTab === 'materials' && <MaterialsSection materials={materials} userRole={user.role} onRefresh={fetchMaterials} />}
        {activeTab === 'audit' && <AuditSection auditLogs={auditLogs} />}
        {activeTab === 'users' && <UsersSection alchemists={alchemists} userRole={user.role} onRefresh={fetchAlchemists} />}
      </main>
    </div>
  );
}

// Componente de carga
function LoadingScreen() {
  return (
    <div style={styles.loadingScreen}>
      <div style={styles.loadingContent}>
        <h1>⚗️</h1>
        <p>Inicializando Sistema de Alquimia...</p>
      </div>
    </div>
  );
}

// Header
function Header({ user, onLogout }) {
  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>⚗️ Sistema de Gestión Alquímica</h1>
        <p style={styles.subtitle}>
          Bienvenido, <strong>{user.username}</strong> ({user.role})
        </p>
      </div>
      <button onClick={onLogout} style={styles.logoutButton}>
        🚪 Cerrar Sesión
      </button>
    </header>
  );
}

// Navegación
function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'alchemists', label: '👥 Alquimistas', icon: '👥' },
    { id: 'missions', label: '📋 Misiones', icon: '📋' },
    { id: 'experiments', label: '🔬 Experimentos', icon: '🔬' },
    { id: 'transmutations', label: '⚡ Transmutaciones', icon: '⚡' },
    { id: 'materials', label: '📦 Materiales', icon: '📦' },
    { id: 'audit', label: '📋 Auditoría', icon: '📋' },
    { id: 'users', label: '👤 Usuarios', icon: '👤' },
  ];

  return (
    <nav style={styles.navigation}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            ...styles.navButton,
            ...(activeTab === tab.id ? styles.navButtonActive : {})
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </nav>
  );
}

// Dashboard
function DashboardSection({ user, data }) {
  const stats = [
    { label: 'Alquimistas Activos', value: data.alchemists.length, icon: '👥' },
    { label: 'Misiones Activas', value: data.missions.filter(m => m.status === 'in_progress').length, icon: '📋' },
    { label: 'Experimentos Pendientes', value: data.experiments.filter(e => e.status === 'pending').length, icon: '🔬' },
    { label: 'Eventos de Auditoría', value: data.auditLogs.length, icon: '📋' },
  ];

  return (
    <section>
      <h2 style={styles.sectionTitle}>📊 Dashboard del Sistema</h2>
      
      <div style={styles.statsGrid}>
        {stats.map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <div style={styles.statIcon}>{stat.icon}</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.dashboardCard}>
          <h3>🚨 Actividad Reciente</h3>
          <div style={styles.activityList}>
            {data.auditLogs.slice(0, 5).map(log => (
              <div key={log.id} style={styles.activityItem}>
                <span style={getSeverityStyle(log.severity)}>●</span>
                <span style={styles.activityText}>
                  <strong>{log.alchemist?.name}</strong>: {log.action}
                </span>
                <span style={styles.activityTime}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.dashboardCard}>
          <h3>⚠️ Experimentos de Alto Riesgo</h3>
          <div style={styles.activityList}>
            {data.experiments
              .filter(exp => exp.risk_level === 'high')
              .slice(0, 5)
              .map(exp => (
                <div key={exp.id} style={styles.activityItem}>
                  <span style={{color: '#ff6b6b'}}>⚠️</span>
                  <span style={styles.activityText}>
                    <strong>{exp.title}</strong> - {exp.alchemist?.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Sección de Alquimistas (
function AlchemistsSection({ alchemists, userRole, onRefresh }) {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newAlchemist, setNewAlchemist] = useState({
    name: '', title: '', specialty: '', rank: '', status: 'Activo', automail: false
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const authApi = axios.create({ 
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      await authApi.post('/api/alchemists/register', newAlchemist);
      setShowRegisterForm(false);
      setNewAlchemist({ name: '', title: '', specialty: '', rank: '', status: 'Activo', automail: false });
      onRefresh();
      alert('Alquimista registrado exitosamente');
    } catch (error) {
      alert('Error registrando alquimista: ' + error.response?.data?.error);
    }
  };

  return (
    <section>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>👥 Alquimistas Estatales</h2>
        {(userRole === 'supervisor' || userRole === 'admin') && (
          <button 
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            style={styles.primaryButton}
          >
            👥 Registrar Nuevo Alquimista
          </button>
        )}
      </div>

      {showRegisterForm && (
        <div style={styles.formCard}>
          <h3>📝 Registrar Nuevo Alquimista</h3>
          <form onSubmit={handleRegister}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Nombre"
                value={newAlchemist.name}
                onChange={(e) => setNewAlchemist({...newAlchemist, name: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Título"
                value={newAlchemist.title}
                onChange={(e) => setNewAlchemist({...newAlchemist, title: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Especialidad"
                value={newAlchemist.specialty}
                onChange={(e) => setNewAlchemist({...newAlchemist, specialty: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Rango"
                value={newAlchemist.rank}
                onChange={(e) => setNewAlchemist({...newAlchemist, rank: e.target.value})}
                style={styles.input}
                required
              />
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newAlchemist.automail}
                  onChange={(e) => setNewAlchemist({...newAlchemist, automail: e.target.checked})}
                />
                Tiene Automail
              </label>
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>
                ✅ Registrar
              </button>
              <button 
                type="button" 
                onClick={() => setShowRegisterForm(false)}
                style={styles.secondaryButton}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.grid}>
        {alchemists.map(alchemist => (
          <div key={alchemist.id} style={styles.card}>
            <h3 style={styles.cardTitle}>
              {alchemist.name} {alchemist.automail && '⚙️'}
            </h3>
            <p><strong>Título:</strong> {alchemist.title}</p>
            <p><strong>Especialidad:</strong> {alchemist.specialty}</p>
            <p><strong>Rango:</strong> {alchemist.rank}</p>
            <p><strong>Estado:</strong> 
              <span style={getStatusStyle(alchemist.status)}>
                {alchemist.status}
              </span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Sección de Experimentos 
function ExperimentsSection({ experiments, userRole, onRefresh }) {
  const [showExperimentForm, setShowExperimentForm] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    title: '', description: '', materials: '', objective: '', risk_level: 'low'
  });

  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    try {
      const authApi = axios.create({ 
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      await authApi.post('/api/experiments', newExperiment);
      setShowExperimentForm(false);
      setNewExperiment({ title: '', description: '', materials: '', objective: '', risk_level: 'low' });
      onRefresh();
      alert('Solicitud de experimento creada exitosamente');
    } catch (error) {
      alert('Error creando experimento: ' + error.response?.data?.error);
    }
  };

  const handleStatusUpdate = async (experimentId, status) => {
    try {
      const authApi = axios.create({ 
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      await authApi.put(`/api/experiments/${experimentId}/status`, { status, notes: 'Actualizado por supervisor' });
      onRefresh();
      alert('Estado actualizado exitosamente');
    } catch (error) {
      alert('Error actualizando estado: ' + error.response?.data?.error);
    }
  };

  return (
    <section>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>🔬 Solicitudes de Experimentos</h2>
        <button 
          onClick={() => setShowExperimentForm(!showExperimentForm)}
          style={styles.primaryButton}
        >
          🔬 Nueva Solicitud
        </button>
      </div>

      {showExperimentForm && (
        <div style={styles.formCard}>
          <h3>🧪 Nueva Solicitud de Experimento</h3>
          <form onSubmit={handleCreateExperiment}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Título del experimento"
                value={newExperiment.title}
                onChange={(e) => setNewExperiment({...newExperiment, title: e.target.value})}
                style={styles.input}
                required
              />
              <textarea
                placeholder="Descripción"
                value={newExperiment.description}
                onChange={(e) => setNewExperiment({...newExperiment, description: e.target.value})}
                style={{...styles.input, minHeight: '80px'}}
                required
              />
              <textarea
                placeholder="Materiales requeridos (separados por coma)"
                value={newExperiment.materials}
                onChange={(e) => setNewExperiment({...newExperiment, materials: e.target.value})}
                style={{...styles.input, minHeight: '60px'}}
                required
              />
              <input
                type="text"
                placeholder="Objetivo"
                value={newExperiment.objective}
                onChange={(e) => setNewExperiment({...newExperiment, objective: e.target.value})}
                style={styles.input}
                required
              />
              <select
                value={newExperiment.risk_level}
                onChange={(e) => setNewExperiment({...newExperiment, risk_level: e.target.value})}
                style={styles.input}
              >
                <option value="low">Bajo Riesgo</option>
                <option value="medium">Riesgo Medio</option>
                <option value="high">Alto Riesgo</option>
              </select>
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>
                ✅ Enviar Solicitud
              </button>
              <button 
                type="button" 
                onClick={() => setShowExperimentForm(false)}
                style={styles.secondaryButton}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.list}>
        {experiments.map(experiment => (
          <div key={experiment.id} style={{
            ...styles.card,
            borderLeft: `4px solid ${getRiskColor(experiment.risk_level)}`
          }}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{experiment.title}</h3>
              <div style={styles.statusBadge}>
                <span style={getStatusStyle(experiment.status)}>{experiment.status}</span>
                <span style={{...styles.riskBadge, background: getRiskColor(experiment.risk_level)}}>
                  {experiment.risk_level}
                </span>
              </div>
            </div>
            
            <p><strong>Descripción:</strong> {experiment.description}</p>
            <p><strong>Materiales:</strong> {experiment.materials}</p>
            <p><strong>Objetivo:</strong> {experiment.objective}</p>
            <p><strong>Solicitante:</strong> {experiment.alchemist?.name}</p>

            {(userRole === 'supervisor' || userRole === 'admin') && experiment.status === 'pending' && (
              <div style={styles.actionButtons}>
                <button 
                  onClick={() => handleStatusUpdate(experiment.id, 'approved')}
                  style={styles.successButton}
                >
                  ✅ Aprobar
                </button>
                <button 
                  onClick={() => handleStatusUpdate(experiment.id, 'rejected')}
                  style={styles.dangerButton}
                >
                  ❌ Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// Sección de Transmutaciones 
function TransmutationSection({ materials, onTransmute }) {
  const [inputMaterials, setInputMaterials] = useState(['']);
  const [outputMaterial, setOutputMaterial] = useState('');
  const [complexity, setComplexity] = useState('simple');
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isTransmuting, setIsTransmuting] = useState(false);

  const addMaterial = () => {
    setInputMaterials([...inputMaterials, '']);
  };

  const updateMaterial = (index, value) => {
    const newMaterials = [...inputMaterials];
    newMaterials[index] = value;
    setInputMaterials(newMaterials);
  };

  const removeMaterial = (index) => {
    if (inputMaterials.length > 1) {
      const newMaterials = inputMaterials.filter((_, i) => i !== index);
      setInputMaterials(newMaterials);
    }
  };

  const handleSimulate = async () => {
    const validMaterials = inputMaterials.filter(m => m.trim());
    
    if (validMaterials.length === 0 || !outputMaterial.trim()) {
      alert('Por favor ingresa al menos un material de entrada y un material de salida');
      return;
    }

    setIsSimulating(true);
    try {
      const authApi = axios.create({ 
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const response = await authApi.post('/api/transmute/simulate', {
        input_materials: validMaterials,
        output_material: outputMaterial,
        complexity: complexity
      });
      
      setSimulationResult(response.data);
    } catch (error) {
      console.error("Error en simulación:", error);
      alert('Error en simulación: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTransmute = async () => {
    const validMaterials = inputMaterials.filter(m => m.trim());
    
    if (validMaterials.length === 0 || !outputMaterial.trim()) {
      alert('Por favor ingresa al menos un material de entrada y un material de salida');
      return;
    }

    setIsTransmuting(true);
    try {
      const authApi = axios.create({ 
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Obtener el usuario actual para el alchemist_id
      const user = JSON.parse(localStorage.getItem('user'));
      
      await authApi.post('/api/transmute', {
        input_materials: validMaterials,
        output_material: outputMaterial,
        alchemist_id: user.id || 1
      });
      
      // Resetear el formulario
      setInputMaterials(['']);
      setOutputMaterial('');
      setSimulationResult(null);
      
      // Actualizar logs de auditoría
      if (onTransmute) onTransmute();
      
      alert('✨ Transmutación realizada exitosamente!');
    } catch (error) {
      console.error("Error en transmutación:", error);
      alert('Error en transmutación: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsTransmuting(false);
    }
  };

  const canTransmute = outputMaterial.trim() && inputMaterials.some(m => m.trim());

  return (
    <section>
      <h2 style={styles.sectionTitle}>⚡ Círculo de Transmutación</h2>
      
      <div style={styles.transmutationContainer}>
        {/* Panel de materiales disponibles */}
        <div style={styles.materialsPanel}>
          <h3 style={styles.panelTitle}>📦 Materiales Disponibles</h3>
          <div style={styles.materialsGrid}>
            {materials && materials.slice(0, 8).map(material => (
              <div key={material.id} style={styles.materialChip}>
                <span style={styles.materialName}>{material.name}</span>
                <span style={styles.materialType}>{material.type}</span>
                <span style={getRarityStyle(material.rarity)}>{material.rarity}</span>
              </div>
            ))}
          </div>
          {materials && materials.length > 8 && (
            <p style={styles.materialHint}>
              ... y {materials.length - 8} materiales más disponibles
            </p>
          )}
        </div>

        {/* Formulario de transmutación */}
        <div style={styles.transmutationForm}>
          <h3 style={styles.formTitle}>🔮 Ley del Intercambio Equivalente</h3>
          <p style={styles.equivalentText}>
            "Para obtener algo, debe ofrecerse algo de igual valor."
          </p>
          
          <div style={styles.inputSection}>
            <label style={styles.inputLabel}>Materiales de Entrada:</label>
            {inputMaterials.map((material, index) => (
              <div key={index} style={styles.materialInputGroup}>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => updateMaterial(index, e.target.value)}
                  placeholder={`Material ${index + 1} (ej: Hierro, Agua, Madera...)`}
                  style={styles.input}
                  list="materials-list"
                />
                {inputMaterials.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeMaterial(index)}
                    style={styles.removeButton}
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
            
            <datalist id="materials-list">
              {materials && materials.map(material => (
                <option key={material.id} value={material.name} />
              ))}
            </datalist>
            
            <button 
              onClick={addMaterial}
              style={styles.addButton}
            >
              ➕ Agregar Material
            </button>
          </div>

          <div style={styles.inputSection}>
            <label style={styles.inputLabel}>Material de Salida Deseado:</label>
            <input
              type="text"
              value={outputMaterial}
              onChange={(e) => setOutputMaterial(e.target.value)}
              placeholder="Qué quieres crear? (ej: Espada, Cura, Escudo...)"
              style={styles.input}
              list="output-materials"
            />
            <datalist id="output-materials">
              <option value="Espada de acero" />
              <option value="Poción curativa" />
              <option value="Escudo protector" />
              <option value="Herramienta" />
              <option value="Artefacto" />
            </datalist>
          </div>

          <div style={styles.inputSection}>
            <label style={styles.inputLabel}>Complejidad de la Transmutación:</label>
            <select 
              value={complexity} 
              onChange={(e) => setComplexity(e.target.value)}
              style={styles.input}
            >
              <option value="simple">🟢 Simple (Materiales básicos)</option>
              <option value="moderate">🟡 Moderada (Combinaciones)</option>
              <option value="complex">🔴 Compleja (Creaciones avanzadas)</option>
            </select>
          </div>

          <div style={styles.actionButtons}>
            <button 
              onClick={handleSimulate}
              disabled={isSimulating || !canTransmute}
              style={styles.simulateButton}
            >
              {isSimulating ? '🔍 Calculando...' : '🔍 Simular Transmutación'}
            </button>
            
            <button 
              onClick={handleTransmute}
              disabled={isTransmuting || !canTransmute || !simulationResult}
              style={{
                ...styles.transmuteButton,
                opacity: (!canTransmute || !simulationResult) ? 0.6 : 1
              }}
            >
              {isTransmuting ? '⚡ Transmutando...' : '⚡ Realizar Transmutación'}
            </button>
          </div>
        </div>

        {/* Resultados de simulación */}
        {simulationResult && (
          <div style={styles.simulationResult}>
            <h3 style={styles.resultTitle}>📊 Resultado de Simulación</h3>
            <div style={styles.simulationGrid}>
              <div style={styles.simulationCard}>
                <div style={styles.simulationIcon}>💰</div>
                <div style={styles.simulationInfo}>
                  <div style={styles.simulationLabel}>Costo Estimado</div>
                  <div style={styles.simulationValue}>{simulationResult.cost} ₣</div>
                </div>
              </div>
              
              <div style={styles.simulationCard}>
                <div style={styles.simulationIcon}>🎯</div>
                <div style={styles.simulationInfo}>
                  <div style={styles.simulationLabel}>Tasa de Éxito</div>
                  <div style={styles.simulationValue}>{simulationResult.success_rate}%</div>
                </div>
              </div>
              
              <div style={styles.simulationCard}>
                <div style={styles.simulationIcon}>⚡</div>
                <div style={styles.simulationInfo}>
                  <div style={styles.simulationLabel}>Energía Requerida</div>
                  <div style={styles.simulationValue}>{simulationResult.energy_required} UE</div>
                </div>
              </div>
              
              <div style={styles.simulationCard}>
                <div style={styles.simulationIcon}>⚖️</div>
                <div style={styles.simulationInfo}>
                  <div style={styles.simulationLabel}>Ley Respetada</div>
                  <div style={styles.simulationValue}>
                    {simulationResult.law_respected ? '✅ Sí' : '❌ No'}
                  </div>
                </div>
              </div>
              
              <div style={styles.simulationCard}>
                <div style={styles.simulationIcon}>⚠️</div>
                <div style={styles.simulationInfo}>
                  <div style={styles.simulationLabel}>Evaluación de Riesgo</div>
                  <div style={getRiskStyle(simulationResult.risk_assessment)}>
                    {simulationResult.risk_assessment}
                  </div>
                </div>
              </div>
              
              <div style={styles.simulationCard}>
                <div style={styles.simulationIcon}>⏱️</div>
                <div style={styles.simulationInfo}>
                  <div style={styles.simulationLabel}>Tiempo Estimado</div>
                  <div style={styles.simulationValue}>{simulationResult.estimated_time}</div>
                </div>
              </div>
            </div>
            
            {!simulationResult.law_respected && (
              <div style={styles.warningBox}>
                <strong>⚠️ Advertencia:</strong> Esta transmutación viola la Ley del Intercambio Equivalente. 
                Se requiere ajustar los materiales de entrada o salida.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Sección de Auditoría (
function AuditSection({ auditLogs }) {
  return (
    <section>
      <h2 style={styles.sectionTitle}>📋 Registro de Auditoría</h2>
      
      <div style={styles.auditStats}>
        <div style={styles.auditStat}>
          Total de Eventos: <strong>{auditLogs.length}</strong>
        </div>
        <div style={styles.auditStat}>
          Alertas Peligrosas: <strong>{auditLogs.filter(log => log.severity === 'danger').length}</strong>
        </div>
        <div style={styles.auditStat}>
          Advertencias: <strong>{auditLogs.filter(log => log.severity === 'warning').length}</strong>
        </div>
      </div>

      <div style={styles.auditList}>
        {auditLogs.map(log => (
          <div key={log.id} style={{
            ...styles.auditItem,
            borderLeft: `4px solid ${getSeverityColor(log.severity)}`
          }}>
            <div style={styles.auditHeader}>
              <div style={styles.auditTitle}>
                <span style={getSeverityStyle(log.severity)}>●</span>
                <strong>{log.action}</strong>
                <span style={styles.auditResource}>en {log.resource}</span>
              </div>
              <div style={styles.auditMeta}>
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div style={styles.auditDetails}>
              <p><strong>Alquimista:</strong> {log.alchemist?.name || 'Sistema'}</p>
              <p><strong>Detalles:</strong> {log.details}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Sección de Materiales (NUEVA)
function MaterialsSection({ materials, userRole, onRefresh }) {
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '', type: 'metal', rarity: 'common', base_value: 0, danger_level: 'safe'
  });

  const handleCreateMaterial = async (materialData) => {
  try {
    const authApi = axios.create({ 
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    const response = await authApi.post('/api/materials', materialData);
    onRefresh();
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error creando material');
  }
};


  return (
    <section>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📦 Catálogo de Materiales</h2>
        {(userRole === 'supervisor' || userRole === 'admin') && (
          <button 
            onClick={() => setShowMaterialForm(!showMaterialForm)}
            style={styles.primaryButton}
          >
            📦 Agregar Material
          </button>
        )}
      </div>

      {showMaterialForm && (
        <div style={styles.formCard}>
          <h3>➕ Nuevo Material</h3>
          <form onSubmit={handleCreateMaterial}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Nombre del material"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                style={styles.input}
                required
              />
              <select
                value={newMaterial.type}
                onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                style={styles.input}
              >
                <option value="metal">Metal</option>
                <option value="organic">Orgánico</option>
                <option value="mineral">Mineral</option>
                <option value="liquid">Líquido</option>
              </select>
              <select
                value={newMaterial.rarity}
                onChange={(e) => setNewMaterial({...newMaterial, rarity: e.target.value})}
                style={styles.input}
              >
                <option value="common">Común</option>
                <option value="uncommon">Poco Común</option>
                <option value="rare">Raro</option>
                <option value="legendary">Legendario</option>
              </select>
              <input
                type="number"
                placeholder="Valor base"
                value={newMaterial.base_value}
                onChange={(e) => setNewMaterial({...newMaterial, base_value: parseFloat(e.target.value)})}
                style={styles.input}
                required
              />
              <select
                value={newMaterial.danger_level}
                onChange={(e) => setNewMaterial({...newMaterial, danger_level: e.target.value})}
                style={styles.input}
              >
                <option value="safe">Seguro</option>
                <option value="caution">Precaución</option>
                <option value="danger">Peligroso</option>
                <option value="forbidden">Prohibido</option>
              </select>
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>
                ✅ Crear Material
              </button>
              <button 
                type="button" 
                onClick={() => setShowMaterialForm(false)}
                style={styles.secondaryButton}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.grid}>
        {materials.map(material => (
          <div key={material.id} style={{
            ...styles.card,
            borderLeft: `4px solid ${getDangerColor(material.danger_level)}`
          }}>
            <h3 style={styles.cardTitle}>{material.name}</h3>
            <p><strong>Tipo:</strong> {material.type}</p>
            <p><strong>Rareza:</strong> 
              <span style={getRarityStyle(material.rarity)}> {material.rarity}</span>
            </p>
            <p><strong>Valor Base:</strong> {material.base_value} ₣</p>
            <p><strong>Nivel de Peligro:</strong> 
              <span style={getDangerStyle(material.danger_level)}> {material.danger_level}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Sección de Usuarios 
function UsersSection({ alchemists, userRole, onRefresh }) {
  const users = alchemists
    .filter(a => a.user)
    .map(a => ({
      id: a.user.id,
      username: a.user.username,
      role: a.user.role,
      alchemist: a
    }));

  return (
    <section>
      <h2 style={styles.sectionTitle}>👤 Usuarios del Sistema</h2>
      
      <div style={styles.grid}>
        {users.map(user => (
          <div key={user.id} style={styles.card}>
            <h3 style={styles.cardTitle}>👤 {user.username}</h3>
            <p><strong>Rol:</strong> 
              <span style={getRoleStyle(user.role)}> {user.role}</span>
            </p>
            <p><strong>Alquimista Asociado:</strong> {user.alchemist.name}</p>
            <p><strong>Título:</strong> {user.alchemist.title}</p>
            <p><strong>Credenciales:</strong> 
              <span style={styles.credentials}>password123</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Funciones de utilidad para estilos
function getStatusStyle(status) {
  const styles = {
    Activo: { color: '#4CAF50', fontWeight: 'bold' },
    pending: { color: '#ff9800', fontWeight: 'bold' },
    approved: { color: '#4CAF50', fontWeight: 'bold' },
    rejected: { color: '#f44336', fontWeight: 'bold' },
    in_progress: { color: '#2196F3', fontWeight: 'bold' },
    completed: { color: '#4CAF50', fontWeight: 'bold' }
  };
  return styles[status] || { color: '#666', fontWeight: 'bold' };
}

function getRiskColor(risk) {
  const colors = {
    low: '#4CAF50',
    medium: '#ff9800', 
    high: '#f44336',
    forbidden: '#9C27B0'
  };
  return colors[risk] || '#666';
}

function getRiskStyle(assessment) {
  if (assessment.includes('FORBIDDEN')) return { color: '#f44336', fontWeight: 'bold' };
  if (assessment.includes('HIGH')) return { color: '#ff9800', fontWeight: 'bold' };
  return { color: '#4CAF50', fontWeight: 'bold' };
}

function getSeverityColor(severity) {
  const colors = {
    danger: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  return colors[severity] || '#666';
}

function getSeverityStyle(severity) {
  return { color: getSeverityColor(severity), marginRight: '8px' };
}

function getDangerColor(level) {
  const colors = {
    safe: '#4CAF50',
    caution: '#ff9800',
    danger: '#f44336',
    forbidden: '#9C27B0'
  };
  return colors[level] || '#666';
}

function getDangerStyle(level) {
  return { color: getDangerColor(level), fontWeight: 'bold' };
}

function getRarityStyle(rarity) {
  const styles = {
    common: { color: '#666' },
    uncommon: { color: '#4CAF50' },
    rare: { color: '#2196F3' },
    legendary: { color: '#FFD700', fontWeight: 'bold' }
  };
  return styles[rarity] || { color: '#666' };
}

function getRoleStyle(role) {
  const styles = {
    alchemist: { color: '#2196F3' },
    supervisor: { color: '#FF9800', fontWeight: 'bold' },
    admin: { color: '#F44336', fontWeight: 'bold' }
  };
  return styles[role] || { color: '#666' };
}

// Estilos 
const styles = {
  appContainer: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'Arial, sans-serif'
  },
  loadingScreen: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  loadingContent: {
    textAlign: 'center'
  },
  header: {
    background: 'rgba(0,0,0,0.8)',
    padding: '1rem',
    borderBottom: '2px solid #ffd700',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: '#ffd700',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    opacity: 0.9
  },
  logoutButton: {
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    padding: '1rem',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  navButton: {
    padding: '0.75rem 1rem',
    background: 'transparent',
    color: 'white',
    border: '2px solid #ffd700',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  navButtonActive: {
    background: '#ffd700',
    color: 'black'
  },
  mainContent: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  sectionTitle: {
    color: '#ffd700',
    borderBottom: '2px solid #ffd700',
    paddingBottom: '0.5rem',
    marginBottom: '1.5rem'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },

  formCard: {
    background: 'rgba(255,255,255,0.1)',
    padding: '2rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,215,0,0.3)',
    marginBottom: '2rem',
    backdropFilter: 'blur(10px)'
  },

  formGrid: {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: '1fr 1fr',
    marginBottom: '1.5rem'
  },

  input: {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1rem',
    color: '#333'
  },

  formActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },

  primaryButton: {
    background: '#ffd700',
    color: 'black',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },

  secondaryButton: {
    background: 'transparent',
    color: '#ffd700',
    border: '2px solid #ffd700',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  successButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },

  warningButton: {
    background: '#ff9800',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },

  missionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },

  card: {
    background: 'rgba(255,255,255,0.1)',
    padding: '1.5rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,215,0,0.3)',
    backdropFilter: 'blur(10px)'
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },

  cardTitle: {
    color: '#ffd700',
    margin: '0',
    fontSize: '1.3rem',
    flex: 1
  },

  missionBadges: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },

  priorityBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '15px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: 'white'
  },

  cardDescription: {
    margin: '0 0 1rem 0',
    lineHeight: '1.5',
    opacity: 0.9
  },

  missionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },

  detailItem: {
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '5px'
  },

  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },

  emptyState: {
    background: 'rgba(255,255,255,0.1)',
    padding: '3rem',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px solid rgba(255,215,0,0.3)'
  },
 transmutationContainer: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '2rem',
    alignItems: 'start'
  },

  materialsPanel: {
    background: 'rgba(255,255,255,0.1)',
    padding: '1.5rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,215,0,0.3)',
    backdropFilter: 'blur(10px)'
  },

  panelTitle: {
    color: '#ffd700',
    margin: '0 0 1rem 0',
    fontSize: '1.1rem'
  },

  materialsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },

  materialChip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '5px',
    fontSize: '0.8rem'
  },

  materialName: {
    fontWeight: 'bold'
  },

  materialType: {
    opacity: 0.7,
    fontSize: '0.7rem'
  },

  materialHint: {
    fontSize: '0.8rem',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: '1rem'
  },

  transmutationForm: {
    background: 'rgba(255,255,255,0.1)',
    padding: '2rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,215,0,0.3)',
    backdropFilter: 'blur(10px)'
  },

  formTitle: {
    color: '#ffd700',
    textAlign: 'center',
    margin: '0 0 0.5rem 0'
  },

  equivalentText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
    margin: '0 0 2rem 0'
  },

  inputSection: {
    marginBottom: '1.5rem'
  },

  inputLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  },

  materialInputGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },

  removeButton: {
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '0.5rem',
    cursor: 'pointer',
    minWidth: '40px'
  },

  addButton: {
    background: 'transparent',
    color: '#ffd700',
    border: '1px solid #ffd700',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },

  actionButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem'
  },

  simulateButton: {
    background: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },

  transmuteButton: {
    background: '#ffd700',
    color: 'black',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },

  simulationResult: {
    gridColumn: '1 / -1',
    background: 'rgba(255,255,255,0.1)',
    padding: '2rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,215,0,0.3)',
    marginTop: '2rem',
    backdropFilter: 'blur(10px)'
  },

  resultTitle: {
    color: '#ffd700',
    textAlign: 'center',
    margin: '0 0 1.5rem 0'
  },

  simulationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },

  simulationCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px'
  },

  simulationIcon: {
    fontSize: '1.5rem'
  },

  simulationInfo: {
    flex: 1
  },

  simulationLabel: {
    fontSize: '0.8rem',
    opacity: 0.8,
    marginBottom: '0.25rem'
  },

  simulationValue: {
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },

  warningBox: {
    background: 'rgba(255,152,0,0.2)',
    border: '1px solid #ff9800',
    padding: '1rem',
    borderRadius: '5px',
    marginTop: '1rem',
    textAlign: 'center'
  }
}; 


function MissionsSection({ missions, userRole, onRefresh, alchemists }) { // ⬅️ Agrega alchemists como prop
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [newMission, setNewMission] = useState({
    title: '', 
    description: '', 
    alchemist_id: '', 
    priority: 'medium'
  });

  const handleCreateMission = async (e) => {
    e.preventDefault();
    try {
      const authApi = axios.create({ 
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Asegurarse de que alchemist_id sea un número
      const missionData = {
        ...newMission,
        alchemist_id: parseInt(newMission.alchemist_id)
      };
      
      console.log("Enviando misión:", missionData);
      
      const response = await authApi.post('/api/missions', missionData);
      setShowMissionForm(false);
      setNewMission({ title: '', description: '', alchemist_id: '', priority: 'medium' });
      onRefresh();
      alert('Misión creada exitosamente');
    } catch (error) {
      console.error("Error creando misión:", error);
      alert('Error creando misión: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <section>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📋 Misiones Activas</h2>
        {(userRole === 'supervisor' || userRole === 'admin') && (
          <button 
            onClick={() => setShowMissionForm(!showMissionForm)}
            style={styles.primaryButton}
          >
            🎯 Nueva Misión
          </button>
        )}
      </div>

      {/* Formulario para crear nueva misión */}
      {showMissionForm && (
        <div style={styles.formCard}>
          <h3>🎯 Crear Nueva Misión</h3>
          <form onSubmit={handleCreateMission}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Título de la misión"
                value={newMission.title}
                onChange={(e) => setNewMission({...newMission, title: e.target.value})}
                style={styles.input}
                required
              />
              <textarea
                placeholder="Descripción detallada de la misión"
                value={newMission.description}
                onChange={(e) => setNewMission({...newMission, description: e.target.value})}
                style={{...styles.input, minHeight: '100px'}}
                required
              />
              
              {/* SELECT CORREGIDO - usa todos los alquimistas */}
              <select
                value={newMission.alchemist_id}
                onChange={(e) => setNewMission({...newMission, alchemist_id: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">Seleccionar Alquimista</option>
                {alchemists && alchemists.map(alchemist => (
                  <option key={alchemist.id} value={alchemist.id}>
                    {alchemist.name} - {alchemist.title} ({alchemist.specialty})
                  </option>
                ))}
              </select>
              
              <select
                value={newMission.priority}
                onChange={(e) => setNewMission({...newMission, priority: e.target.value})}
                style={styles.input}
                required
              >
                <option value="low">🟢 Baja Prioridad</option>
                <option value="medium">🟡 Media Prioridad</option>
                <option value="high">🔴 Alta Prioridad</option>
              </select>
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>
                ✅ Crear Misión
              </button>
              <button 
                type="button" 
                onClick={() => setShowMissionForm(false)}
                style={styles.secondaryButton}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}




      {/* Lista de misiones */}
      {missions.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>📭 No hay misiones activas</h3>
          <p>No se han creado misiones en el sistema.</p>
        </div>
      ) : (
        <div style={styles.missionsList}>
          {missions.map(mission => (
            <div key={mission.id} style={{
              ...styles.card,
              borderLeft: `4px solid ${
                mission.priority === 'high' ? '#f44336' : 
                mission.priority === 'medium' ? '#ff9800' : '#4CAF50'
              }`
            }}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{mission.title}</h3>
                <div style={styles.missionBadges}>
                  <span style={{
                    ...styles.priorityBadge,
                    background: mission.priority === 'high' ? '#f44336' : 
                               mission.priority === 'medium' ? '#ff9800' : '#4CAF50'
                  }}>
                    {mission.priority === 'high' ? 'ALTA' : 
                     mission.priority === 'medium' ? 'MEDIA' : 'BAJA'}
                  </span>
                  <span style={getStatusStyle(mission.status)}>
                    {mission.status === 'pending' ? 'PENDIENTE' :
                     mission.status === 'in_progress' ? 'EN PROGRESO' : 
                     mission.status === 'completed' ? 'COMPLETADA' : mission.status}
                  </span>
                </div>
              </div>
              
              <p style={styles.cardDescription}>{mission.description}</p>
              
              <div style={styles.missionDetails}>
                <div style={styles.detailItem}>
                  <strong>👤 Asignado a:</strong> {mission.alchemist?.name || 'No asignado'}
                </div>
                <div style={styles.detailItem}>
                  <strong>🎯 Especialidad requerida:</strong> {mission.alchemist?.specialty || 'No especificada'}
                </div>
                <div style={styles.detailItem}>
                  <strong>⏱️ Creado:</strong> {new Date(mission.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={styles.actionButtons}>
                {(userRole === 'supervisor' || userRole === 'admin') && (
                  <>
                    {mission.status !== 'completed' && (
                      <button 
                        onClick={() => handleStatusUpdate(mission.id, 'completed')}
                        style={styles.successButton}
                      >
                        ✅ Completar
                      </button>
                    )}
                    {mission.status !== 'in_progress' && mission.status !== 'completed' && (
                      <button 
                        onClick={() => handleStatusUpdate(mission.id, 'in_progress')}
                        style={styles.warningButton}
                      >
                        🚀 Iniciar
                      </button>
                    )}
                    {mission.status !== 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(mission.id, 'pending')}
                        style={styles.secondaryButton}
                      >
                        ⏸️ Pausar
                      </button>
                    )}
                  </>
                )}
                
                {}
                {userRole === 'alchemist' && mission.status !== 'completed' && (
                  <button 
                    onClick={() => handleStatusUpdate(mission.id, 'completed')}
                    style={styles.successButton}
                  >
                    ✅ Marcar como Completada
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AmestrisAlchemySystem;