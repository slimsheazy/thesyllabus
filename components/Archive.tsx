
import React, { useState } from 'react';
import { GlossaryTerm } from './GlossaryEngine';

const RESOURCES = [
  { 
    title: "meanings of midpoints", 
    category: "logic", 
    color: "var(--marker-blue)",
    url: "https://cafeastrology.com/astrologytopics/meaningsofmidpoints.html"
  },
  { 
    title: "essential dignities & debilities", 
    category: "math", 
    color: "var(--marker-red)",
    url: "https://www.skyscript.co.uk/dig2.html"
  },
  { 
    title: "the almuten of the figure", 
    category: "ancient", 
    color: "var(--marker-purple)",
    url: "https://www.astrology.com.tr/articles.asp?artID=53"
  },
  { 
    title: "past life indicators in synastry", 
    category: "logic", 
    color: "var(--marker-black)",
    url: "https://advanced-astrology.com/past-life-indicators-in-synastry-karmic/"
  },
  { 
    title: "name asteroids catalog", 
    category: "vibe", 
    color: "var(--marker-teal)",
    url: "https://plutonicdesire.net/name-asteroids/"
  },
  { 
    title: "astrology of death transits", 
    category: "ancient", 
    color: "var(--marker-green)",
    url: "https://www.yourtango.com/zodiac/death-transits-astrology"
  },
  { 
    title: "understanding progressed charts", 
    category: "future", 
    color: "var(--marker-blue)",
    url: "https://www.mindbodygreen.com/articles/progressed-chart?srsltid=AfmBOoofXHpGF1rHd0mxJ4CKjLIBNVc0z7gP2qpoTkTwUraYg8g1jyY8"
  },
  { 
    title: "tarot: key 07 deconstruction", 
    category: "ancient", 
    color: "var(--marker-red)",
    url: "https://sacred-texts.com/tarot/ftc/ftc07.htm"
  },
  { 
    title: "tarot: key 06 deconstruction", 
    category: "ancient", 
    color: "var(--marker-purple)",
    url: "https://sacred-texts.com/tarot/ftc/ftc06.htm"
  },
  { 
    title: "lenormand: grand tableau spread", 
    category: "logic", 
    color: "var(--marker-black)",
    url: "https://labyrinthos.co/blogs/learn-tarot-with-labyrinthos-academy/how-to-read-the-grand-tableau-a-36-card-lenormand-spread"
  },
  { 
    title: "guide to cartomancy", 
    category: "vibe", 
    color: "var(--marker-teal)",
    url: "https://www.mindbodygreen.com/articles/cartomancy"
  },
  { 
    title: "locational astrology: acg", 
    category: "space", 
    color: "var(--marker-green)",
    url: "https://www.skyscript.co.uk/acg.html"
  },
  { 
    title: "the solar return chart", 
    category: "future", 
    color: "var(--marker-blue)",
    url: "https://upastrology.com/blog/solar-return-chart-its-significance-and-how-to-read-it"
  },
  { 
    title: "candle magic color meanings", 
    category: "vibe", 
    color: "var(--marker-red)",
    url: "https://www.cosmopolitan.com/lifestyle/a31133533/candle-magic-colors-meaning/"
  },
  { 
    title: "candle magick correspondences", 
    category: "vibe", 
    color: "var(--marker-purple)",
    url: "https://forestofwisdom.com.au/blogs/into-the-forest/beginner-s-guide-to-spell-candle-magick-and-colour-correspondences"
  },
  { 
    title: "rune meanings & frequencies", 
    category: "ancient", 
    color: "var(--marker-black)",
    url: "https://www.paranormality.com/runes.shtml#FREY"
  },
  { 
    title: "enneagram: levels of development", 
    category: "logic", 
    color: "var(--marker-teal)",
    url: "http://www.fitzel.ca/enneagram/levels.html"
  }
];

const Archive: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContribute = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Submission successful. Thank you for expanding the syllabus.");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-4 md:px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full">
        <header className="mb-12 md:mb-20 text-center space-y-4">
          <h1 className="title-main !text-6xl md:!text-9xl mb-4 font-bold text-marker-blue">the <GlossaryTerm word="Archive">archive</GlossaryTerm></h1>
          <div className="inline-block handwritten text-xl text-marker-blue opacity-60 italic">Open Source <GlossaryTerm word="Esoteric">Esoteric</GlossaryTerm> <GlossaryTerm word="Repository">Repository</GlossaryTerm></div>
          <div className="w-full h-0.5 bg-marker-black/10 marker-border mt-4"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {RESOURCES.map((res, idx) => (
            <a 
              key={idx} 
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="marker-border border-marker-black/10 bg-white/40 p-6 md:p-10 group hover:border-marker-blue transition-all cursor-pointer relative block no-underline"
            >
              <div className="absolute top-4 right-4 handwritten text-sm opacity-20 uppercase tracking-widest">{res.category}</div>
              <div className="flex flex-col items-start gap-2">
                <span className="handwritten text-sm font-bold uppercase tracking-[0.3em]" style={{ color: res.color }}>entry {idx + 1}</span>
                <span className="heading-marker text-3xl md:text-4xl text-marker-black leading-tight lowercase group-hover:text-marker-blue transition-colors">{res.title}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-20 md:mt-24 flex justify-center pb-32">
           <div className="p-8 md:p-16 max-w-4xl w-full text-center marker-border border-marker-black bg-white/40 shadow-xl relative group">
              <p className="heading-marker text-3xl md:text-5xl italic mb-8 md:mb-10 leading-snug lowercase tracking-tight group-hover:scale-102 transition-transform">
                "the <GlossaryTerm word="Future">future</GlossaryTerm> belongs to those who can <GlossaryTerm word="Decode">decode</GlossaryTerm> the hidden world."
              </p>
              <button 
                onClick={handleContribute}
                disabled={isSubmitting}
                className="brutalist-button w-full py-6 md:py-8 text-xl md:text-2xl"
              >
                {isSubmitting ? "Uploading research..." : "Submit Research →"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
