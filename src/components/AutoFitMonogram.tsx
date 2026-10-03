import React from 'react';

interface AutoFitMonogramProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AutoFitMonogram:
 * SVG viewBox əsaslı 100% Sinxron və Riyazi Vahid Render sistemi:
 * 
 * Səbəb:
 * Əvvəlki kodda admin panelindəki ölçü ilə əsas səhifədəki ölçü fərqli CSS px və
 * 'truncate' sinfi istifadə etdiyi üçün əsas səhifədə "NMEXMAN" sözü kəsilərək "NMEXM..." kimi görünürdü!
 * 
 * Həll:
 * 1. Həm Admin panelindəki 84px dairədə, həm də əsas səhifədəki 110px/142px dairədə
 *    DAXİLİ SVG VİEWBOX 100x100 İLƏ 100% EYNİ RƏFTAR VƏ GÖRÜNÜŞ TƏMİN EDİLİR.
 * 2. Mətn heç vaxt kəsilmir ("truncate" və ya üç nöqtə yoxdur).
 * 3. 8 hərfə qədər (məs: "NMEXMAN", "BAKU", "FRERES", "USERNAME"):
 *    Tək sətirdə dairənin tam ortasında iri, qalın və zərif brend möhürü kimi oturur.
 * 4. 8 hərfdən çox olduqda (və ya çoxsözlü olduqda):
 *    Alt-alta 2 sətirdə mərkəzdə tam balanslı və bərabər aralıqla nümayiş olunur.
 * 5. Beləliklə, admin panelində necə görünürsə, əsas səhifədə də ZƏRRƏ QƏDƏR FƏRQ OLMADAN,
 *    DƏQİQ EYNİ FORMATDA VƏ KƏSİLMƏDƏN GÖRÜNÜR!
 */
export const AutoFitMonogram: React.FC<AutoFitMonogramProps> = ({
  text,
  className = '',
  style = {},
}) => {
  const rawClean = (text || 'username').trim();

  // Çoxsözlü və ya 8 hərfdən çox olduqda sətirlərə bölürük
  let lines: string[] = [];
  const words = rawClean.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    lines = words;
  } else if (rawClean.length > 8) {
    const mid = Math.ceil(rawClean.length / 2);
    lines = [rawClean.slice(0, mid), rawClean.slice(mid)];
  } else {
    lines = [rawClean];
  }

  const isStacked = lines.length >= 2;
  const maxLineLen = lines.reduce((max, l) => Math.max(max, l.length), 0);

  // SVG viewBox (100 x 100) daxilində riyazi font ölçüləri:
  let svgFontSize = 14;
  let letterSpacing = '0.04em';

  if (!isStacked) {
    // Tək sətir (1 - 8 hərf): "NMEXMAN" (7 hərf), "FRERES" (6 hərf) və s.
    if (maxLineLen <= 4) {
      svgFontSize = 19;
      letterSpacing = '0.12em';
    } else if (maxLineLen <= 6) {
      svgFontSize = 16.5;
      letterSpacing = '0.08em';
    } else if (maxLineLen <= 7) {
      // "NMEXMAN" kimi 7 hərfli sözlər üçün qızıl nisbət:
      svgFontSize = 14.5;
      letterSpacing = '0.04em';
    } else {
      // 8 hərf (məs: "USERNAME")
      svgFontSize = 13;
      letterSpacing = '0.02em';
    }
  } else {
    // Alt-alta 2 sətir:
    if (maxLineLen <= 5) {
      svgFontSize = 13.5;
      letterSpacing = '0.06em';
    } else if (maxLineLen <= 7) {
      svgFontSize = 11.5;
      letterSpacing = '0.03em';
    } else {
      svgFontSize = 10;
      letterSpacing = '0.01em';
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden bg-black p-1">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {isStacked ? (
          // İki və ya daha çox sətir olduqda
          lines.map((line, idx) => {
            // Şaquli mərkəzləşdirmə hesabı (idx 0 -> 42, idx 1 -> 60)
            const totalLines = lines.length;
            const lineSpacing = 16;
            const startY = 50 - ((totalLines - 1) * lineSpacing) / 2;
            const yPos = startY + idx * lineSpacing;

            return (
              <text
                key={idx}
                x="50"
                y={yPos + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontWeight="800"
                fontSize={svgFontSize}
                letterSpacing={letterSpacing}
                style={{
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.4))',
                  ...style,
                }}
                className={className}
              >
                {line}
              </text>
            );
          })
        ) : (
          // Tək sətir olduqda: Tam mərkəz (50, 52), heç vaxt kəsilmir və kənara toxunmur!
          <text
            x="50"
            y="52.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontWeight="800"
            fontSize={svgFontSize}
            letterSpacing={letterSpacing}
            style={{
              fontFamily: 'inherit',
              textTransform: 'uppercase',
              filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.45))',
              ...style,
            }}
            className={className}
          >
            {lines[0]}
          </text>
        )}
      </svg>
    </div>
  );
};
