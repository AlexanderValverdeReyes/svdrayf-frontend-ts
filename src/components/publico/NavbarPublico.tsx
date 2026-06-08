import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1rem 2rem', backgroundColor: 'var(--blanco)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ fontWeight: 'bold', color: 'var(--azul-rey)', fontSize: '1.5rem' }}>
        MV <span style={{ color: 'var(--dorado)' }}>Maleño VIP</span>
      </div>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '2rem', margin: 0, padding: 0 }}>
        <li><Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: '600' }}>Inicio</Link></li>
        <li><Link to="/servicios" style={{ textDecoration: 'none', color: '#333', fontWeight: '600' }}>Servicios</Link></li>
        <li><Link to="/paraderos" style={{ textDecoration: 'none', color: '#333', fontWeight: '600' }}>Paraderos</Link></li>
      </ul>
      <div>
        <Link to="/login">
          <button style={{
            padding: '10px 24px', backgroundColor: 'var(--azul-rey)',
            color: 'var(--blanco)', border: 'none', borderRadius: '8px',
            fontWeight: 'bold', cursor: 'pointer'
          }}>
            Iniciar Sesión
          </button>
        </Link>
      </div>
    </nav>
  );
}
export default Navbar;