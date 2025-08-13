import React, { useMemo, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Map as MapIcon, Crown } from "lucide-react";

/** Ajustes globales */
const TOTAL_POP = 10_000_000;
const TILT_X = 4; // grados máx
const TILT_Y = 6;

/** Provincias con pesos (suman 100), capital y rol */
const PROVINCES = [
  {
    id: "aurora",
    name: "Aurora",
    capital: "Dawnspire",
    role: "Saber y observatorios solares.",
    weight: 18,
    gen: {
      cx: 180,
      cy: 245,
      rx: 110,
      ry: 72,
      rot: -0.2,
      seed: 11,
      detail: 72,
      irr: 0.08,
    },
    label: { x: 180, y: 235 },
  },
  {
    id: "helios",
    name: "Helios",
    capital: "Sunreach",
    role: "Agro y energía limpia.",
    weight: 27,
    gen: {
      cx: 430,
      cy: 235,
      rx: 130,
      ry: 82,
      rot: 0.1,
      seed: 22,
      detail: 74,
      irr: 0.075,
    },
    label: { x: 430, y: 225 },
  },
  {
    id: "nova",
    name: "Nova",
    capital: "Starhaven",
    role: "Tecnología e industrias creativas.",
    weight: 22,
    gen: {
      cx: 310,
      cy: 385,
      rx: 100,
      ry: 68,
      rot: 0.05,
      seed: 33,
      detail: 70,
      irr: 0.083,
    },
    label: { x: 310, y: 375 },
  },
  {
    id: "meridian",
    name: "Meridian",
    capital: "Highnoon",
    role: "Comercio y logística.",
    weight: 23,
    gen: {
      cx: 560,
      cy: 380,
      rx: 120,
      ry: 76,
      rot: 0.07,
      seed: 44,
      detail: 72,
      irr: 0.08,
    },
    label: { x: 560, y: 370 },
  },
  {
    id: "umbra",
    name: "Umbra",
    capital: "Nightgate",
    role: "Defensa y frontera montañosa.",
    weight: 10,
    gen: {
      cx: 145,
      cy: 432,
      rx: 88,
      ry: 60,
      rot: -0.1,
      seed: 55,
      detail: 68,
      irr: 0.085,
    },
    label: { x: 145, y: 432 },
  },
];

/** Utils */
const fmtShort = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString();

function lcg(seed) {
  // generador determinista simple
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

/** Genera costa suave: elipse + ruido de baja frecuencia + spline */
function genCoast({
  cx,
  cy,
  rx,
  ry,
  rot = 0,
  seed = 1,
  detail = 72,
  irr = 0.08,
}) {
  const rnd = lcg(seed);
  const k1 = 2 + Math.floor(rnd() * 2); // 2–3 ondas grandes
  const k2 = 5 + Math.floor(rnd() * 3); // 5–7 ondulaciones finas
  const p1 = rnd() * Math.PI * 2;
  const p2 = rnd() * Math.PI * 2;

  const pts = [];
  for (let i = 0; i < detail; i++) {
    const t = (i / detail) * Math.PI * 2;
    const noise =
      1 + irr * (0.6 * Math.sin(k1 * t + p1) + 0.4 * Math.sin(k2 * t + p2));
    const a = t + rot;
    pts.push([cx + Math.cos(a) * rx * noise, cy + Math.sin(a) * ry * noise]);
  }
  return pointsToPath(pts, true, 0.5);
}

/** Catmull-Rom -> path cúbico */
function pointsToPath(pts, closed = true, tension = 0.5) {
  const p = pts.slice();
  if (closed) p.push(pts[0], pts[1], pts[2]);
  const d = [`M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`];
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    const cp1x = x1 + ((x2 - x0) / 6) * tension;
    const cp1y = y1 + ((y2 - y0) / 6) * tension;
    const cp2x = x2 - ((x3 - x1) / 6) * tension;
    const cp2y = y2 - ((y3 - y1) / 6) * tension;
    d.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
        1
      )} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
    );
  }
  if (closed) d.push("Z");
  return d.join(" ");
}

/** ---- Componente principal ---- */
export default function SolarisMapPro({ selected, onSelect }) {
  const wrapRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const [hovered, setHovered] = useState(null);

  const provinces = useMemo(() => {
    let acc = 0;
    return PROVINCES.map((p) => {
      const pop = Math.round((p.weight / 100) * TOTAL_POP);
      acc += pop;
      return { ...p, pop, d: genCoast(p.gen) };
    });
  }, []);

  function handlePointerMove(e) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    rotateX.set((0.5 - y) * TILT_X);
    rotateY.set((x - 0.5) * TILT_Y);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const extrudeOffset = { dx: 5, dy: 6 };

  return (
    <div className="w-full grid md:grid-cols-2 gap-6 items-start">
      {/* Lienzo */}
      <div className="rounded-2xl shadow-lg bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 p-4">
        <motion.div
          ref={wrapRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handleLeave}
          style={{ perspective: 1000 }}
          className="aspect-[4/3] w-full"
        >
          <motion.svg
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            viewBox="0 0 800 600"
            className="w-full h-full rounded-xl"
          >
            <defs>
              <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#87c5e6" />
                <stop offset="100%" stopColor="#2f6f97" />
              </linearGradient>
              <linearGradient id="extrude" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#091a2a" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.04" />
              </linearGradient>
              {/* Gradiente de tierra invertido (centro un poco más oscuro, costa clara) */}
              <radialGradient id="land" cx="50%" cy="45%" r="72%">
                <stop offset="0%" stopColor="#bfe1b9" />
                <stop offset="65%" stopColor="#cce9c1" />
                <stop offset="100%" stopColor="#def2cd" />
              </radialGradient>
              <filter
                id="coastGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="1.6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="selectedGlow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feGaussianBlur stdDeviation="4" result="sg" />
                <feMerge>
                  <feMergeNode in="sg" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradiente puntual para halo de selección y plataforma blur */}
              <radialGradient id="spot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <filter
                id="softBlur"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="12" />
              </filter>
            </defs>

            {/* Océano */}
            <rect x="0" y="0" width="800" height="600" fill="url(#ocean)" />

            {/* Plataforma marina para dar sensación de conjunto */}
            <ellipse
              cx="430"
              cy="320"
              rx="240"
              ry="170"
              fill="#8cd0f5"
              opacity="0.25"
              filter="url(#softBlur)"
            />

            {/* Islas separadas (posiciones ya espaciadas) */}
            <g>
              {provinces.map((island) => {
                const active = selected === island.id;
                const isHover = hovered === island.id;
                return (
                  <g
                    key={island.id}
                    onPointerEnter={() => setHovered(island.id)}
                    onPointerLeave={() => setHovered(null)}
                    onClick={() => onSelect?.(island.id)}
                    className="cursor-pointer"
                  >
                    {/* halo de selección (detrás) */}
                    {active && (
                      <circle
                        cx={island.label.x}
                        cy={island.label.y}
                        r={95}
                        fill="url(#spot)"
                        opacity="0.9"
                      >
                        <animate
                          attributeName="r"
                          values="80;105;80"
                          dur="2.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* extrusión sutil */}
                    <path
                      d={island.d}
                      transform={`translate(${extrudeOffset.dx}, ${extrudeOffset.dy})`}
                      fill="url(#extrude)"
                      opacity={0.5}
                    />

                    {/* tierra */}
                    <motion.path
                      d={island.d}
                      fill="url(#land)"
                      initial={false}
                      animate={{ scale: isHover || active ? 1.015 : 1 }}
                      style={{ transformOrigin: "center" }}
                      filter={active ? "url(#selectedGlow)" : undefined}
                      stroke={active ? "#fbbf24" : "#2b5c4a"}
                      strokeWidth={active ? 2.2 : 1.6}
                    />

                    {/* resplandor de costa (marca separación con el mar) */}
                    <path
                      d={island.d}
                      fill="none"
                      stroke={active ? "#fff7ed" : "#e9f6d6"}
                      strokeWidth={active ? 4.5 : 3.5}
                      opacity={active ? 0.6 : 0.5}
                      filter="url(#coastGlow)"
                    />

                    {/* etiqueta */}
                    <text
                      x={island.label.x}
                      y={island.label.y}
                      className="select-none"
                      fill="#0b1f1a"
                      fontSize="13"
                      textAnchor="middle"
                      style={{ paintOrder: "stroke" }}
                      stroke={active ? "#fff7ed" : "#ffffff"}
                      strokeWidth={3}
                    >
                      {island.name}
                    </text>
                    <text
                      x={island.label.x}
                      y={island.label.y}
                      className="select-none"
                      fill="#0b1f1a"
                      fontSize="13"
                      textAnchor="middle"
                    >
                      {island.name}
                    </text>
                    <text
                      x={island.label.x}
                      y={island.label.y + 16}
                      fill="#183d31"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {fmtShort(island.pop)}
                    </text>
                  </g>
                );
              })}

              {/* Capital Imperial (separada de Helios) */}
              <g
                onClick={() => onSelect?.("capital")}
                className="cursor-pointer"
              >
                <circle cx="445" cy="290" r="7" fill="#ef4444">
                  <animate
                    attributeName="r"
                    values="7;9;7"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text x="458" y="294" fill="#fee2e2" fontSize="12">
                  Solaria Prime
                </text>
              </g>
            </g>
          </motion.svg>
        </motion.div>
      </div>

      {/* Panel derecho */}
      <div className="rounded-2xl shadow-lg bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-3">
          <MapIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            Mapa Interactivo del Imperio
          </h3>
        </div>
        {!selected ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Haz clic en una provincia para ver capital, rol y población; o en la
            capital imperial (punto rojo).
          </p>
        ) : selected === "capital" ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4" />
              <span className="font-medium">Capital Imperial</span>
            </div>
            <ul className="text-sm list-disc pl-6 space-y-1 text-zinc-700 dark:text-zinc-300">
              <li>Residencia del Monarca y sede de Consejos Espejo.</li>
              <li>Centro de emisión de Decretos Reales y Edictos.</li>
              <li>Archivo del Código Solariano.</li>
            </ul>
          </div>
        ) : (
          <ProvincePanel provinces={provinces} selected={selected} />
        )}
      </div>
    </div>
  );
}

function ProvincePanel({ provinces, selected }) {
  const p = provinces.find((x) => x.id === selected);
  if (!p) return null;
  const pct = ((p.weight / 100) * 100).toFixed(1);
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-600" />
        <span className="font-medium">{p.name}</span>
      </div>
      <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
        <div>
          <span className="font-medium">Capital:</span> {p.capital}
        </div>
        <div>
          <span className="font-medium">Rol:</span> {p.role}
        </div>
        <div>
          <span className="font-medium">Población:</span>{" "}
          {p.pop.toLocaleString()} ({pct}%)
        </div>
        <div className="text-xs text-zinc-500">
          Ajusta los pesos en <code>PROVINCES.weight</code> para redistribuir el
          total (10,000,000).
        </div>
      </div>
    </div>
  );
}
