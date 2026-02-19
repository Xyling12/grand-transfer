import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Tariffs from "@/components/Tariffs";
import PopularRoutes from "@/components/PopularRoutes";
import BookingForm from "@/components/BookingForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <WhyChooseUs />
      <Tariffs />
      <PopularRoutes />
      <BookingForm />
      <Footer />
    </main>
  );
}
