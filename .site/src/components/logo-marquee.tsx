const logos: { src: string; alt: string; square?: boolean; wide?: boolean }[] = [
  { src: "/logos/yango.svg", alt: "Yango" },
  { src: "/logos/rmk.svg", alt: "РМК" },
  { src: "/logos/the-village.svg", alt: "The Village" },
  { src: "/logos/fonte.svg", alt: "Fonte" },
  { wide: true, src: "/logos/astana-hub.svg", alt: "Astana Hub" },
  { src: "/logos/staya.svg", alt: "Стая" },
  { src: "/logos/toples.svg", alt: "Топлес" },
  { square: true, src: "/logos/hog.svg", alt: "HOG" },
  { src: "/logos/slkrd.svg", alt: "Slkrd" },
  { square: true, src: "/logos/osmisle.svg", alt: "O’Smisle" },
];

// Бегущая строка логотипов по схеме Marquee из Magic UI: несколько одинаковых групп,
// каждая сдвигается на свою ширину + отступ — петля бесшовная, анимируется только transform (GPU).
// Края растворяются наложенными градиентами, а не mask-image: маска перерисовывалась каждый кадр и давала рывки.
const REPEAT = 4;

export function LogoMarquee() {
  return (
    <div className="marquee mt-14 sm:mt-16" aria-label="Клиенты и партнёры">
      {Array.from({ length: REPEAT }, (_, k) => (
        <ul key={k} className="marquee-group" aria-hidden={k > 0 ? true : undefined}>
          {logos.map((l) => (
            <li key={l.src}>
              <img src={l.src} alt={k === 0 ? l.alt : ""} decoding="async" draggable={false} className={l.square ? "logo-square" : l.wide ? "logo-wide" : undefined} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
