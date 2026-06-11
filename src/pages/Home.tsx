import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

import img1 from '../assets/img1.png';
import img3 from '../assets/img3.png';
import img4 from '../assets/img4.png';
// import busPrincipal from '../assets/bus-principal.png';  // Aún no se usa

const imagenesCarrusel: string[] = [img1, img3, img4];

const Home: React.FC = () => {
  return (
    <>
      {/* Estilos responsivos adicionales */}
      <style>{`
        @media (max-width: 768px) {
          .home-title {
            font-size: 2.2rem !important;
          }
          .home-subtitle {
            font-size: 1.1rem !important;
          }
          .home-content-row {
            gap: 2rem !important;
          }
          .home-bus-col {
            max-width: 300px !important;
          }
        }
        @media (max-width: 480px) {
          .home-title {
            font-size: 1.8rem !important;
          }
          .home-subtitle {
            font-size: 1rem !important;
          }
          .home-content-row {
            gap: 1.5rem !important;
            padding: 0 1rem;
          }
        }
      `}</style>

      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Carrusel de fondo */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            style={{ width: '100%', height: '100%' }}
          >
            {imagenesCarrusel.map((img, index) => (
              <SwiperSlide key={index}>
                <img src={img} alt={`Fondo ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Capa oscura */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1
        }}></div>

        {/* Contenido */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="home-content-row" style={{
            display: 'flex', flexDirection: 'row', gap: '4rem',
            alignItems: 'center', maxWidth: '1200px', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {/* Columna texto */}
            <div style={{ color: 'white', maxWidth: '600px' }}>
              <h1 className="home-title" style={{ fontSize: '3.5rem', fontWeight: '900', textTransform: 'uppercase' }}>
                TU DESTINO ASEGURADO CON <br />
                <span style={{ color: '#c9a037' }}>MALEÑO VIP</span>
              </h1>
              <p className="home-subtitle" style={{ fontSize: '1.4rem', marginTop: '1rem', lineHeight: 1.5 }}>
                Viajes cómodos y seguros de Mala a Lima y viceversa.
              </p>
            </div>

            {/* Columna bus */}
            <div className="home-bus-col" style={{ maxWidth: '500px', width: '100%' }}>
              {/* <img src={busPrincipal} alt="Bus Maleño VIP" style={{ width: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;