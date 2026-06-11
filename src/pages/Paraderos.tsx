import React from 'react';
import { paraderosData } from '../data/paraderosData';

interface Paradero {
  id: number;
  nombre: string;
  descripcion: string;
  etiqueta: string;
  imagen: string;
}

const Paraderos: React.FC = () => {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .paraderos-section {
            padding: 2rem 1rem !important;
          }
          .paraderos-title {
            font-size: 2rem !important;
          }
          .paraderos-subtitle {
            font-size: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .paraderos-section {
            padding: 1.5rem 0.8rem !important;
          }
        }
      `}</style>

      <div className="paraderos-section" style={{ padding: '4rem 2rem', backgroundColor: 'var(--blanco)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="paraderos-title titulo-seccion">Nuestros Paraderos</h2>
          <p className="paraderos-subtitle subtitulo-seccion">
            Conoce los destinos que conectamos en la ruta Mala – Lima.
          </p>

          {/* Rejilla de tarjetas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {(paraderosData as Paradero[]).map((paradero) => (
              <div key={paradero.id} style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ height: '180px', overflow: 'hidden' }}>
                  <img src={paradero.imagen} alt={paradero.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ color: 'var(--azul-rey)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {paradero.nombre}
                  </h3>
                  <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {paradero.descripcion}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: 'var(--dorado-claro)',
                    color: 'var(--azul-oscuro)',
                    padding: '5px 15px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {paradero.etiqueta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Paraderos;