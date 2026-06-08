// src/pages/Services.jsx
import React from 'react';
import { serviciosData } from '../data/ServiciosData';

const Services = () => {
  return (
    <div style={{ padding: '4rem 2rem', backgroundColor: 'var(--azul-rey)', minHeight: '80vh' }}>
      
      {/* ENCABEZADO */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', color: 'white' }}>
        <h2 style={{ fontSize: '2.8rem' }}>Nuestros Servicios</h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Conectamos Lima y el Sur Chico con la mayor comodidad, seguridad y puntualidad.
        </p>
      </div>

      {/* TARJETAS DE SERVICIO */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2rem', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {serviciosData.map((servicio:any, index:number) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            borderTop: `5px solid var(--dorado)`
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--azul-rey)' }}>
              {servicio.icono}
            </div>
            <h3 style={{ color: 'var(--azul-rey)', fontSize: '1.5rem', marginBottom: '0.8rem' }}>
              {servicio.titulo}
            </h3>
            <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '1.2rem', lineHeight: 1.6 }}>
              {servicio.descripcion}
            </p>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              {servicio.caracteristicas.map((item:any, idx:number) => (
                <p key={idx} style={{ fontSize: '0.9rem', color: '#333', margin: '0.4rem 0' }}>
                  {item}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NÚMERO DE CONTACTO EN LA PARTE INFERIOR */}
      <div style={{ 
        marginTop: '4rem', 
        textAlign: 'center', 
        backgroundColor: 'var(--dorado)', 
        padding: '1.5rem', 
        borderRadius: '50px', 
        maxWidth: '600px', 
        marginLeft: 'auto', 
        marginRight: 'auto' 
      }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--blanco)' }}>
           ¿Tienes alguna duda? Contáctanos al <span style={{ fontSize: '1.5rem' }}>+51 987 654 321</span>
        </p>
      </div>

    </div>
  );
};

export default Services;