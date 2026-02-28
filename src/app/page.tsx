
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Hero from '../components/Hero';

// Below-fold — lazy load
const WhyChooseUs = dynamic(() => import('../components/WhyChooseUs'));
const Tariffs = dynamic(() => import('../components/Tariffs'));
const PopularRoutes = dynamic(() => import('../components/PopularRoutes'));
const Reviews = dynamic(() => import('../components/Reviews'));
const Footer = dynamic(() => import('../components/Footer'));
const BookingFormWrapper = dynamic(() => import('../components/BookingFormWrapper'));


export default function Home() {
  return (
    <main>
      {/* ✅ Якорь для scrollspy */}
      <div id="top" />

      {/* Soft decorative gradient blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Header />
      <Hero />
      <WhyChooseUs />
      <Tariffs />
      <PopularRoutes />
      <BookingFormWrapper />
      <Reviews />
      <Footer />
    </main>
  );
}