'use client';

import Header from '../components/Header';
import Hero from '../components/Hero';
import WhyChooseUs from '../components/WhyChooseUs';
import Tariffs from '../components/Tariffs';
import PopularRoutes from '../components/PopularRoutes';
import Reviews from '../components/Reviews';
import Footer from '../components/Footer';
import dynamic from 'next/dynamic';

const BookingForm = dynamic(() => import('../components/BookingForm'), {
  ssr: false,
});

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
      <BookingForm />
      <Reviews />
      <Footer />
    </main>
  );
}