import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { Map as MapIcon, Crown } from "lucide-react";

/** ---- Ajustes globales ---- */
const TOTAL_POP = 10_000_000;
const TILT_X = 4;
const TILT_Y = 6;
const SVG_W = 800;
const SVG_H = 600;

/** Provincias (puedes ajustar irr/lobes/jag por isla) */
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
      irr: 0.09,
      lobes: 5,
      jag: 0.35,
    },
    label: { x: 180, y: 235 },
  },
  {
    id: "helios",
    name: "Shurima",
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
      irr: 0.085,
      lobes: 6,
      jag: 0.32,
    },
    label: { x: 430, y: 225 },
  },
  {
    id: "nova",
    name: "Noxus",
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
      irr: 0.095,
      lobes: 5,
      jag: 0.38,
    },
    label: { x: 310, y: 375 },
  },
  {
    id: "meridian",
    name: "Targon",
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
      irr: 0.09,
      lobes: 6,
      jag: 0.34,
    },
    label: { x: 560, y: 370 },
  },
  {
    id: "umbra",
    name: "Jonia",
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
      irr: 0.1,
      lobes: 4,
      jag: 0.36,
    },
    label: { x: 145, y: 432 },
  },
];

/** -------- Utils -------- */
const fmtShort = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString();

function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
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

/** Costa con lóbulos (penínsulas/bahías) */
function genCoast({
  cx,
  cy,
  rx,
  ry,
  rot = 0,
  seed = 1,
  detail = 72,
  irr = 0.09,
  lobes = 5,
  jag = 0.35,
}) {
  const rnd = lcg(seed);
  const k1 = 2 + Math.floor(rnd() * 2);
  const k2 = 5 + Math.floor(rnd() * 3);
  const p1 = rnd() * Math.PI * 2;
  const p2 = rnd() * Math.PI * 2;

  const bumps = Array.from({ length: lobes }, () => ({
    th: rnd() * Math.PI * 2,
    amp: (rnd() * 2 - 1) * irr * 0.9,
    wid: 0.22 + rnd() * 0.35,
  }));

  const pts = [];
  for (let i = 0; i < detail; i++) {
    const t = (i / detail) * Math.PI * 2;
    const a = t + rot;

    let rNoise =
      1 +
      irr * (0.35 * Math.sin(k1 * t + p1) + 0.25 * Math.sin(k2 * t + p2)) +
      (rnd() - 0.5) * irr * jag * 0.35;

    for (const b of bumps) {
      const dTh = Math.min(
        Math.abs(t - b.th),
        Math.PI * 2 - Math.abs(t - b.th)
      );
      rNoise += b.amp * Math.exp(-(dTh * dTh) / (2 * b.wid * b.wid));
    }

    const px = cx + Math.cos(a) * rx * rNoise;
    const py = cy + Math.sin(a) * ry * rNoise;
    pts.push([px, py]);
  }

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const bbox = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };

  const centroid = polygonCentroid(pts);
  return { d: pointsToPath(pts, true, 0.5), pts, bbox, centroid };
}

/** Centroide de un polígono (area-weighted). Si área ~0, usa bbox. */
function polygonCentroid(pts) {
  let A = 0,
    Cx = 0,
    Cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0],
      yi = pts[i][1];
    const xj = pts[j][0],
      yj = pts[j][1];
    const f = xj * yi - xi * yj; // cross product
    A += f;
    Cx += (xj + xi) * f;
    Cy += (yj + yi) * f;
  }
  A *= 0.5;
  if (Math.abs(A) < 1e-6) {
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }
  return { x: Cx / (6 * A), y: Cy / (6 * A) };
}

/** Separación AABB simple con gap */
function separateIslands(items, gap = 10, maxIters = 40) {
  const out = items.map((it) => ({ ...it, tx: 0, ty: 0 }));
  for (let iter = 0; iter < maxIters; iter++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const A = out[i],
          B = out[j];
        const ab = {
          x: A.bbox.x + A.tx,
          y: A.bbox.y + A.ty,
          w: A.bbox.w,
          h: A.bbox.h,
        };
        const bb = {
          x: B.bbox.x + B.tx,
          y: B.bbox.y + B.ty,
          w: B.bbox.w,
          h: B.bbox.h,
        };
        const overlapX =
          Math.min(ab.x + ab.w + gap, bb.x + bb.w) - Math.max(ab.x - gap, bb.x);
        const overlapY =
          Math.min(ab.y + ab.h + gap, bb.y + bb.h) - Math.max(ab.y - gap, bb.y);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const push = overlapX / 2 + 0.5;
            const dir = ab.x + ab.w / 2 < bb.x + bb.w / 2 ? -1 : 1;
            A.tx += dir * push;
            B.tx -= dir * push;
          } else {
            const push = overlapY / 2 + 0.5;
            const dir = ab.y + ab.h / 2 < bb.y + bb.h / 2 ? -1 : 1;
            A.ty += dir * push;
            B.ty -= dir * push;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return out;
}

const hash32 = (str) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** ---- Componente principal ---- */
export default function SolarisMapPro({ selected, onSelect }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const [hovered, setHovered] = useState(null);
  const [world, setWorld] = useState({ x: 0, y: 0, scale: 1 });
  const dragState = useRef({
    dragging: false,
    moved: false,
    startClient: { x: 0, y: 0 },
    startWorld: { x: 0, y: 0, scale: 1 },
  });

  const provinces = useMemo(() => {
    const base = PROVINCES.map((p) => {
      const pop = Math.round((p.weight / 100) * TOTAL_POP);
      const seed = (p.gen.seed ?? hash32(p.id)) >>> 0;
      const shape = genCoast({ ...p.gen, seed });
      return { ...p, pop, ...shape, seed };
    });

    const spaced = separateIslands(base, 10); // gap de 10px

    return spaced.map((p) => ({
      ...p,
      bboxShift: {
        x: p.bbox.x + (p.tx || 0),
        y: p.bbox.y + (p.ty || 0),
        w: p.bbox.w,
        h: p.bbox.h,
      },
      centroidShift: {
        x: p.centroid.x + (p.tx || 0),
        y: p.centroid.y + (p.ty || 0),
      },
    }));
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

  /** Pan+Zoom animado al seleccionar */
  const worldTarget = useMemo(() => {
    if (!selected) return { scale: 1, x: 0, y: 0 };
    if (selected === "capital") {
      const cx = 445,
        cy = 290,
        w = 26,
        h = 26;
      const s = Math.min(2.2, Math.min((SVG_W * 0.6) / w, (SVG_H * 0.6) / h));
      const tx = SVG_W / (2 * s) - cx;
      const ty = SVG_H / (2 * s) - cy;
      return { scale: s, x: tx, y: ty };
    }
    const p = provinces.find((x) => x.id === selected);
    if (!p) return { scale: 1, x: 0, y: 0 };
    const pad = 30;
    const w = p.bboxShift.w + pad * 2;
    const h = p.bboxShift.h + pad * 2;
    const s = Math.min(2.4, Math.min((SVG_W * 0.65) / w, (SVG_H * 0.65) / h));
    // Usar centroide en lugar de bbox center para mejor centrado
    const cx = p.centroidShift.x;
    const cy = p.centroidShift.y;
    const tx = SVG_W / (2 * s) - cx;
    const ty = SVG_H / (2 * s) - cy;
    return { scale: s, x: tx, y: ty };
  }, [selected, provinces]);

  // Al cambiar selección, animar el mundo hacia el objetivo
  useEffect(() => {
    setWorld((prev) => ({ ...prev, ...worldTarget }));
  }, [worldTarget]);

  // Utils para convertir delta cliente -> delta mundo
  const clientToWorldDelta = useCallback(
    (dxClient, dyClient) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { dx: 0, dy: 0 };
      const kx = SVG_W / rect.width;
      const ky = SVG_H / rect.height;
      const dxSvg = dxClient * kx;
      const dySvg = dyClient * ky;
      const s = world.scale || 1;
      return { dx: dxSvg / s, dy: dySvg / s };
    },
    [world.scale]
  );

  // Drag para pan
  const onPointerDown = useCallback(
    (e) => {
      dragState.current.dragging = true;
      dragState.current.moved = false;
      dragState.current.startClient = { x: e.clientX, y: e.clientY };
      dragState.current.startWorld = { ...world };
    },
    [world]
  );

  const onPointerMoveDrag = useCallback(
    (e) => {
      if (!dragState.current.dragging) return;
      const dxClient = e.clientX - dragState.current.startClient.x;
      const dyClient = e.clientY - dragState.current.startClient.y;
      if (Math.abs(dxClient) > 2 || Math.abs(dyClient) > 2)
        dragState.current.moved = true;
      const { dx, dy } = clientToWorldDelta(dxClient, dyClient);
      setWorld((prev) => ({
        ...prev,
        x: dragState.current.startWorld.x + dx,
        y: dragState.current.startWorld.y + dy,
      }));
    },
    [clientToWorldDelta]
  );

  const onPointerUp = useCallback(() => {
    dragState.current.dragging = false;
    // no-op; el click de selección se controla con moved
  }, []);

  // Zoom con rueda, centrado en cursor
  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cursorX = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const cursorY = ((e.clientY - rect.top) / rect.height) * SVG_H;
      const factor = Math.exp((-e.deltaY / 100) * 0.1); // suave
      const newScale = Math.max(0.6, Math.min(3, world.scale * factor));
      const xPrime = ((cursorX + world.x) * world.scale) / newScale - cursorX;
      const yPrime = ((cursorY + world.y) * world.scale) / newScale - cursorY;
      setWorld({ x: xPrime, y: yPrime, scale: newScale });
    },
    [world]
  );

  // ✅ springs dentro del componente
  const wx = useSpring(0, { stiffness: 140, damping: 22, mass: 0.7 });
  const wy = useSpring(0, { stiffness: 140, damping: 22, mass: 0.7 });
  const ws = useSpring(1, { stiffness: 140, damping: 22, mass: 0.7 });

  // ✅ empujar springs cuando cambia world
  useEffect(() => {
    wx.set(world.x);
    wy.set(world.y);
    ws.set(world.scale);
  }, [world.x, world.y, world.scale, wx, wy, ws]);

  // ✅ string reactivo para el atributo transform (SVG units, origen 0,0)
  const worldTransform = useMotionTemplate`translate(${wx} ${wy}) scale(${ws})`;

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
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-full rounded-xl"
            ref={svgRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMoveDrag}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
            onContextMenu={(e) => e.preventDefault()}
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

            {/* Océano (clic para reset) */}
            <rect
              x="0"
              y="0"
              width={SVG_W}
              height={SVG_H}
              fill="url(#ocean)"
              onClick={() => {
                if (dragState.current.moved) return; // si fue drag, no resetear
                setWorld({ x: 0, y: 0, scale: 1 });
                onSelect && onSelect(undefined);
              }}
            />
            <ellipse
              cx="430"
              cy="320"
              rx="240"
              ry="170"
              fill="#8cd0f5"
              opacity="0.25"
              filter="url(#softBlur)"
            />

            {/* Mundo con pan+zoom */}
            <motion.g transform={worldTransform}>
              {provinces.map((island) => {
                const active = selected === island.id;
                const isHover = hovered === island.id;
                const faded =
                  selected && selected !== island.id && selected !== "capital";
                return (
                  <g
                    key={island.id}
                    transform={`translate(${island.tx || 0}, ${
                      island.ty || 0
                    })`}
                    onPointerEnter={() => setHovered(island.id)}
                    onPointerLeave={() => setHovered(null)}
                    onClick={() => {
                      if (dragState.current.moved) return; // evitar click tras drag
                      onSelect && onSelect(island.id);
                    }}
                    className="cursor-pointer"
                    opacity={faded ? 0.35 : 1}
                  >
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

                    <path
                      d={island.d}
                      transform={`translate(${5}, ${6})`}
                      fill="url(#extrude)"
                      opacity={0.5}
                    />

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

                    <path
                      d={island.d}
                      fill="none"
                      stroke={active ? "#fff7ed" : "#e9f6d6"}
                      strokeWidth={active ? 4.5 : 3.5}
                      opacity={active ? 0.6 : 0.5}
                      filter="url(#coastGlow)"
                    />

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

              {/* Capital */}
              <g
                onClick={() => onSelect && onSelect("capital")}
                className="cursor-pointer"
                opacity={selected && selected !== "capital" ? 0.35 : 1}
              >
                <circle cx="445" cy="290" r="7" fill="#ef4444">
                  <animate
                    attributeName="r"
                    values="7;9;7"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text x="458" y="294" fill="#000000ff" fontSize="12">
                  Solaria
                </text>
              </g>
            </motion.g>
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
            capital imperial (punto rojo). Clic en el océano para reiniciar el
            zoom.
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
