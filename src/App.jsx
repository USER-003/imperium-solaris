import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2,
  Crown,
  Scale,
  ScrollText,
  Map as MapIcon,
  Gavel,
  Landmark,
  Shield,
  Building2,
  BadgeCheck,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";

/**
 * Imperium Solaris — Landing Oficial (Single-file React component)
 * UI: TailwindCSS + shadcn/ui guidelines (no import needed for Tailwind)
 * Interactions: framer-motion animations, simple SVG map with clickable provincias
 *
 * Content sources (resumido del material del usuario):
 * - Forma de gobierno: Monarquía Absoluta Solariana
 * - Estructura: Círculo de Autoridades Cruzadas (Consejo de Estrategia, Ministerios de Ejecución, Cuerpo de Revisión)
 * - Jerarquía normativa: Decretos Reales > Edictos Ministeriales > Sentencias Espejo
 * - Nacionalidad: nacimiento, linaje, decreto; pérdida por traición, renuncia con permiso real, sanción por decreto
 * - Proceso jurídico básico: Registro de empresa con aprobación directa del monarca
 * - Población aproximada: 10 millones
 */

// ------ Data layer ------
const SUPREME_LAW = {
  title: "Ley Suprema de Imperium Solaris",
  text: `La voluntad del Monarca Solariano constituye la ley suprema e inapelable del Estado. \n\nTodos los órganos existen por delegación real y carecen de poder de veto. El monarca puede crear, reformar o disolver cualquier institución y reasignar recursos en cualquier momento mediante Decreto Real.`,
};

const STATS = [
  { label: "Población", value: "10,000,000" },
  { label: "Régimen", value: "Monarquía Absoluta" },
  { label: "Capital", value: "Solaria Prime" },
  { label: "División", value: "5 Provincias Solares" },
];

const HIERARCHY = [
  {
    name: "Decretos Reales",
    detail:
      "Normas supremas dictadas por el Monarca. Tienen efecto inmediato y prevalecen sobre toda otra disposición.",
  },
  {
    name: "Edictos Ministeriales",
    detail:
      "Normas delegadas para ejecución operativa. Requieren firma de un ministerio ajeno como control cruzado, pero no limitan la autoridad del monarca.",
  },
  {
    name: "Sentencias Espejo",
    detail:
      "Fallos emitidos por jueces del Cuerpo de Revisión Permanente, con rotación obligatoria y control cruzado.",
  },
];

const THREE_SPHERES = [
  {
    key: "estrategia",
    title: "Consejo de Estrategia",
    icon: Landmark,
    bullets: [
      "5 miembros designados por el monarca",
      "Propone políticas y planes; no administra recursos",
      "Ningún consejero aprueba proyectos de su propia cartera",
    ],
  },
  {
    key: "ejecucion",
    title: "Ministerios de Ejecución",
    icon: Building2,
    bullets: [
      "6 ministerios operativos",
      "Presupuestos cruzados administrados por otro ministerio",
      "Ejecución directa de órdenes y decretos reales",
    ],
  },
  {
    key: "revision",
    title: "Cuerpo de Revisión Permanente",
    icon: Scale,
    bullets: [
      "9 revisores designados por el monarca",
      "Rotación funcional cada 90 días",
      "Auditoría, inspección y judicatura sin poder de veto",
    ],
  },
];

const NATIONALITY = {
  acquire: [
    "Por nacimiento en territorio de Solaris",
    "Por linaje (hijos de solarianos, incluso en el extranjero)",
    "Por Decreto Real como honor o mérito",
  ],
  lose: [
    "Por traición al monarca o al Imperio",
    "Por renuncia voluntaria con aprobación real",
    "Por decreto real como sanción excepcional",
  ],
};

const PROCESS_REG_COMPANY = [
  "Presentar solicitud ante el Ministerio de Comercio, describiendo el giro",
  "Evaluación directa del monarca (aprobación o rechazo)",
  "Otorgamiento del Sello Real para operar legalmente",
];

// Provincias del mapa ficticio
const PROVINCES = [
  {
    id: "aurora",
    name: "Aurora",
    capital: "Dawnspire",
    blurb: "Puerta oriental, centros de saber y observatorios solares.",
  },
  {
    id: "helios",
    name: "Helios",
    capital: "Sunreach",
    blurb: "Corazón agrícola y polos de energía limpia.",
  },
  {
    id: "nova",
    name: "Nova",
    capital: "Starhaven",
    blurb: "Distrito tecnológico e industrias creativas.",
  },
  {
    id: "meridian",
    name: "Meridian",
    capital: "Highnoon",
    blurb: "Eje comercial y nodos logísticos interprovinciales.",
  },
  {
    id: "umbra",
    name: "Umbra",
    capital: "Nightgate",
    blurb: "Frontera montañosa y comando de defensa imperial.",
  },
];

// ------ UI helpers ------
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur border border-zinc-200/60 dark:border-zinc-800 ${className}`}
  >
    {children}
  </div>
);

const Section = ({ id, title, icon: Icon, children, subtitle }) => (
  <section id={id} className="py-14 sm:py-20">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="w-6 h-6" />}
        <h2 className="text-2xl sm:text-3xl font-semibold">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-zinc-600 dark:text-zinc-300 mb-8 max-w-3xl">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  </section>
);

// ------ Map component ------
function SolarisMap({ selected, onSelect }) {
  // simple SVG Islands / regions; purely illustrative
  const regionClass = (id) =>
    `transition-all stroke-2 ${
      selected === id
        ? "fill-amber-300/80 stroke-amber-500"
        : "fill-amber-100/60 dark:fill-amber-200/20 stroke-amber-600/50 hover:fill-amber-300/60"
    }`;

  return (
    <div className="w-full grid md:grid-cols-2 gap-6 items-center">
      <Card className="p-4">
        <div className="aspect-[4/3] w-full">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Ocean background */}
            <rect
              x="0"
              y="0"
              width="800"
              height="600"
              className="fill-sky-100 dark:fill-sky-900"
            />

            {/* Provinces (abstract shapes) */}
            <g filter="url(#glow)">
              <path
                id="aurora"
                onClick={() => onSelect("aurora")}
                d="M120,220 C200,150 330,160 360,240 C330,320 220,340 150,300 Z"
                className={regionClass("aurora")}
              />
              <path
                id="helios"
                onClick={() => onSelect("helios")}
                d="M380,260 C460,210 560,230 600,300 C560,360 470,380 400,330 Z"
                className={regionClass("helios")}
              />
              <path
                id="nova"
                onClick={() => onSelect("nova")}
                d="M280,360 C360,330 450,420 420,470 C350,500 290,470 260,430 Z"
                className={regionClass("nova")}
              />
              <path
                id="meridian"
                onClick={() => onSelect("meridian")}
                d="M540,360 C620,340 690,390 660,450 C610,490 530,470 520,420 Z"
                className={regionClass("meridian")}
              />
              <path
                id="umbra"
                onClick={() => onSelect("umbra")}
                d="M160,420 C230,420 260,500 200,520 C140,510 120,460 140,440 Z"
                className={regionClass("umbra")}
              />
            </g>

            {/* Labels */}
            <text
              x="260"
              y="220"
              className="fill-zinc-900 dark:fill-white text-sm select-none"
            >
              Aurora
            </text>
            <text
              x="470"
              y="270"
              className="fill-zinc-900 dark:fill-white text-sm select-none"
            >
              Helios
            </text>
            <text
              x="320"
              y="410"
              className="fill-zinc-900 dark:fill-white text-sm select-none"
            >
              Nova
            </text>
            <text
              x="580"
              y="410"
              className="fill-zinc-900 dark:fill-white text-sm select-none"
            >
              Meridian
            </text>
            <text
              x="160"
              y="470"
              className="fill-zinc-900 dark:fill-white text-sm select-none"
            >
              Umbra
            </text>

            {/* Capital marker */}
            <g onClick={() => onSelect("capital")} className="cursor-pointer">
              <circle cx="440" cy="310" r="7" className="fill-rose-500" />
              <text
                x="452"
                y="315"
                className="fill-rose-600 dark:fill-rose-300 text-xs"
              >
                Solaria Prime
              </text>
            </g>
          </svg>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <MapIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            Mapa Interactivo del Imperio
          </h3>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
          Selecciona una provincia para ver su ficha. Todas las provincias
          rinden cuentas al Monarca. Sus autoridades son designadas y removidas
          por Decreto Real.
        </p>
        <ProvincePanel selected={selected} />
      </Card>
    </div>
  );
}

function ProvincePanel({ selected }) {
  const meta = useMemo(
    () => PROVINCES.find((p) => p.id === selected),
    [selected]
  );
  if (!selected) {
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        Haz clic en el mapa. Provincias: Aurora, Helios, Nova, Meridian, Umbra.
      </div>
    );
  }
  if (selected === "capital") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-4 h-4" />
          <span className="font-medium">Capital Imperial</span>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
          Solaria Prime
        </p>
        <ul className="text-sm list-disc pl-6 space-y-1 text-zinc-700 dark:text-zinc-300">
          <li>Residencia del Monarca y sede de los Consejos Espejo.</li>
          <li>Centro de emisión de Decretos Reales y Edictos.</li>
          <li>Archivo del Código Solariano.</li>
        </ul>
      </div>
    );
  }
  if (!meta) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Globe2 className="w-4 h-4" />
        <span className="font-medium">{meta.name}</span>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
        Capital provincial: {meta.capital}
      </p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{meta.blurb}</p>
    </div>
  );
}

// ------ Main page ------
export default function ImperiumSolarisLanding() {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [showLaw, setShowLaw] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/60 backdrop-blur border-b border-zinc-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-600" />
            <span className="font-semibold">Imperium Solaris</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a href="#suprema" className="hover:underline">
              Ley Suprema
            </a>
            <a href="#gobierno" className="hover:underline">
              Gobierno
            </a>
            <a href="#normas" className="hover:underline">
              Jerarquía
            </a>
            <a href="#nacionalidad" className="hover:underline">
              Nacionalidad
            </a>
            <a href="#procesos" className="hover:underline">
              Procesos
            </a>
            <a href="#mapa" className="hover:underline">
              Mapa
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-100 via-amber-50 to-transparent dark:from-amber-900/20 dark:via-zinc-900" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="grid md:grid-cols-2 items-center gap-10">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl font-bold tracking-tight"
              >
                Imperium Solaris
              </motion.h1>
              <p className="mt-4 text-zinc-600 dark:text-zinc-300 max-w-xl">
                Página oficial del Imperio. Bajo la luz del Sol, la autoridad
                del Monarca guía cada decreto, cada obra y cada provincia.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => setShowLaw(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                >
                  <Gavel className="w-4 h-4" /> Ver Ley Suprema
                </button>
                <a
                  href="#mapa"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <MapIcon className="w-4 h-4" /> Explorar Mapa
                </a>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATS.map((s) => (
                  <Card key={s.label} className="p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      {s.label}
                    </p>
                    <p className="text-lg font-semibold">{s.value}</p>
                  </Card>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Principio Supremo</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  La voluntad del Monarca Solariano constituye la ley suprema e
                  inapelable del Estado. Los órganos actúan por delegación y
                  carecen de poder de veto.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Supreme Law modal */}
      <AnimatePresence>
        {showLaw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="max-w-2xl w-full"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-5 h-5" />
                  <h3 id="suprema" className="text-xl font-semibold">
                    {SUPREME_LAW.title}
                  </h3>
                </div>
                <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-200">
                  {SUPREME_LAW.text}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowLaw(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Cerrar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Government */}
      <Section
        id="gobierno"
        title="Organización del Gobierno"
        icon={Landmark}
        subtitle="Modelo 'Círculo de Autoridades Cruzadas': coordinación y control interno al servicio del poder absoluto del Monarca."
      >
        <div className="grid lg:grid-cols-3 gap-6">
          {THREE_SPHERES.map(({ key, title, icon: Icon, bullets }) => (
            <Card key={key} className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold">{title}</h3>
              </div>
              <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-disc pl-5">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <Card className="p-6 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            <p className="text-sm">
              <span className="font-medium">Nota:</span> Todos los cargos son
              designados y removidos libremente por el Monarca. Ningún órgano
              posee poder de veto.
            </p>
          </div>
        </Card>
      </Section>

      {/* Norms hierarchy */}
      <Section
        id="normas"
        title="Jerarquía Normativa"
        icon={ScrollText}
        subtitle="Las normas existen por delegación del Monarca."
      >
        <div className="grid md:grid-cols-3 gap-6">
          {HIERARCHY.map((h, idx) => (
            <motion.div
              key={h.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-300 font-semibold">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold">{h.name}</h3>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {h.detail}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Nationality */}
      <Section
        id="nacionalidad"
        title="Nacionalidad Solariana"
        icon={BadgeCheck}
        subtitle="Definida por nacimiento, linaje o Decreto Real; susceptible de pérdida por traición o renuncia aprobada."
      >
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Cómo se adquiere</h3>
            <ul className="text-sm list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
              {NATIONALITY.acquire.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Cómo se pierde</h3>
            <ul className="text-sm list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
              {NATIONALITY.lose.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Process */}
      <Section
        id="procesos"
        title="Proceso Jurídico: Registro de Empresa"
        icon={Gavel}
        subtitle="Todo registro depende de la aprobación directa del Monarca."
      >
        <Card className="p-6">
          <ol className="text-sm list-decimal pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
            {PROCESS_REG_COMPANY.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <CheckCircle2 className="w-4 h-4" />
            El Sello Real autoriza la operación inmediata y se publicita en la
            Gaceta Solariana.
          </div>
        </Card>
      </Section>

      {/* Map */}
      <Section
        id="mapa"
        title="Territorio Imperial"
        icon={MapIcon}
        subtitle="Cinco provincias interdependientes bajo autoridad real."
      >
        <SolarisMap
          selected={selectedProvince}
          onSelect={setSelectedProvince}
        />
      </Section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600" />
            <span className="text-sm">Imperium Solaris — Autoridad Real</span>
          </div>
          <div className="text-xs text-zinc-500">
            © Imperium Solaris. Toda disposición queda sujeta a Decreto Real
            vigente.
          </div>
        </div>
      </footer>
    </div>
  );
}
