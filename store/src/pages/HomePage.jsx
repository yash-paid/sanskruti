import React from 'react';
import HeroSection from '../components/HeroSection';
import LatestArrivals from '../components/LatestArrivals';
import BestSelling from '../components/BestSelling';
import BenefitsSection from '../components/BenefitsSection';
import CategoriesSection from '../components/CategoriesSection';
import TestimonialsSection from '../components/TestimonialsSection';
import FaqSection from '../components/FaqSection';

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <LatestArrivals />
      <BestSelling />
      <BenefitsSection />
      <CategoriesSection />
      <TestimonialsSection />
      <FaqSection />
    </div>
  );
}
