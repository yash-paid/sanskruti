import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '../data/products';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section className="py-10 sm:py-16 bg-white border-t border-[#f0f0f0] font-['Lexend_Deca'] text-[#202027]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <h2 className="text-[23px] sm:text-[29px] font-semibold text-[#202027] leading-[1.3]">
            Frequently Asked <span className="text-[#ff673c]">Questions</span>
          </h2>
          <p className="text-[12px] text-[#777777] font-normal mt-1.5 font-['Montserrat']">
            Clear answers to help you start downloading and creating with confidence
          </p>
        </div>

        <div className="space-y-3 font-['Montserrat']">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-[#e6e6e6] rounded-[10px] bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-4 font-semibold text-[13px] sm:text-[14px] text-[#202027] hover:text-[#ff673c] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={17}
                    className={`text-[#888] transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'transform rotate-180 text-[#ff673c]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-4.5 pb-4 text-[13px] text-[#555555] leading-[1.75] font-normal border-t border-[#f4f4f4] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
