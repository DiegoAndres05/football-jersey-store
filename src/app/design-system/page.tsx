import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Globe,
  Heart,
  ImageIcon,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trophy,
  Truck,
  User,
} from "lucide-react";
import { whatsappLink } from "@/shared/config/site";
import { NameNumberPreview } from "@/components/home/name-number-preview";

const interHeavy = localFont({
  src: [
    { path: "../fonts/inter-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/inter-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-ui-heavy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flashsport — Componentes desglosados",
  robots: { index: false, follow: false },
};

const heavy = "[font-family:var(--font-ui-heavy),var(--font-sans)]";

const PRODUCTS = [
  {
    badge: "-29% OFF",
    badgeClass: "bg-black text-white",
    meta: "La Liga · Visitante",
    name: "FC Barcelona 26/27 Visitante",
    detail: "Bajo pedido especial · 15-20 días",
    was: "$120.000 COP",
    price: "$85.000",
    note: null as string | null,
    status: "Bajo pedido",
    statusClass: "rounded-full bg-[#f2f0ec] px-2.5 py-1 text-[11px] font-medium text-[#6e6a64]",
  },
  {
    badge: "Selecciones",
    badgeClass: "bg-[#f0c21a] text-[#1a1a1a]",
    meta: "Conmebol · Local",
    name: "Selección Colombia 2026 Local",
    detail: "Edición Mundial 2026 · Tallas S a XXL",
    was: null,
    price: "$89.000",
    note: "Precio estándar",
    status: "Alta demanda",
    statusClass: "text-[12px] font-semibold text-[#3b82f6]",
  },
  {
    badge: "Colección Retro",
    badgeClass: "bg-[#ef8b22] text-white",
    meta: "Archivo histórico · 1998",
    name: "Brasil Retro 98 Home R9",
    detail: "Detalles originales de época reeditados",
    was: "$135.000 COP",
    price: "$95.000",
    note: null,
    status: "Stock Limitado",
    statusClass: "text-[12px] font-semibold text-[#e07a1a]",
  },
  {
    badge: "Nueva 26/27",
    badgeClass: "bg-[#1b2330] text-white",
    meta: "La Liga · Local",
    name: "Real Madrid 26/27 Local",
    detail: "Versión Fan & Player · Todas las tallas",
    was: null,
    price: "$89.900",
    note: "Precio estándar",
    status: "En stock",
    statusClass: "text-[12px] font-semibold text-[#1f9d55]",
  },
] as const;

function FlashMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-black ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
        <path
          d="M13.2 1.5 4.4 13.2h6.1L9.6 22.5l10-12.2h-6.2L13.2 1.5Z"
          fill="currentColor"
        />
      </svg>
      <span className={`${heavy} text-[20px] font-extrabold tracking-[0.01em]`}>FLASHSPORT</span>
    </span>
  );
}

function Spec({
  index,
  title,
  tag,
}: {
  index: string;
  title: string;
  tag: string;
}) {
  return (
    <div className="mb-4 mt-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#a39e97]">
        Componente <span className="ml-1.5 tracking-[0.18em]">{index}</span>
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-4">
        <h2 className={`${heavy} text-[22px] font-extrabold uppercase leading-none tracking-[-0.03em] text-[#111]`}>
          {title}
        </h2>
        <span className="shrink-0 rounded-lg bg-[#f3f1ed] px-2.5 py-1 text-[12px] font-medium text-[#8d8882]">
          {tag}
        </span>
      </div>
    </div>
  );
}

function Photo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#e6e3fb] ${className}`}>
      <ImageIcon className="h-7 w-7 text-[#746de0]" strokeWidth={1.75} />
    </div>
  );
}

function LeagueIcon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px] text-[#2a2a2a]";
  if (name === "Premier League") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 3.8v16.4M3.8 12h16.4M6.2 6.6c2 1.6 4 2.4 5.8 2.4s3.8-.8 5.8-2.4M6.2 17.4c2-1.6 4-2.4 5.8-2.4s3.8.8 5.8 2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (name === "La Liga") return <Trophy className={common} strokeWidth={1.7} />;
  if (name === "Serie A") return <Shield className={common} strokeWidth={1.7} />;
  if (name === "Bundesliga") return <Star className={common} strokeWidth={1.7} />;
  if (name === "Ligue 1") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#2a2a2a]" aria-hidden="true">
        <circle cx="12" cy="6.2" r="2.15" fill="currentColor" />
        <circle cx="7.3" cy="10.4" r="2.15" fill="currentColor" />
        <circle cx="16.7" cy="10.4" r="2.15" fill="currentColor" />
        <path d="M10.85 11.6h2.3v5.1c0 1.15-.55 1.9-1.15 2.15-.6-.25-1.15-1-1.15-2.15v-5.1Z" fill="currentColor" />
      </svg>
    );
  }
  return <Globe className={common} strokeWidth={1.7} />;
}

const LEAGUES = [
  ["Premier League", "Inglaterra"],
  ["La Liga", "España"],
  ["Serie A", "Italia"],
  ["Bundesliga", "Alemania"],
  ["Ligue 1", "Francia"],
  ["Selecciones", "Mundiales"],
] as const;

export default function DesignSystemPage() {
  return (
    <div className={`${interHeavy.variable} ${interHeavy.className} bg-[#faf9f7]`}>
      <div className="mx-auto w-full max-w-[1240px] px-6 pb-16 pt-10 sm:px-8">
        <header>
          <span className={`${heavy} inline-flex rounded-full bg-black px-3 py-[5px] text-[10px] font-bold uppercase tracking-[0.14em] text-white`}>
            Design System & UI Library
          </span>
          <h1 className={`${heavy} mt-5 text-[34px] font-extrabold uppercase leading-none tracking-[-0.04em] text-[#111] sm:text-[38px] lg:whitespace-nowrap`}>
            Flashsport — Componentes desglosados
          </h1>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-[560px] text-[14.5px] leading-[1.45] text-[#6f6b66]">
              Librería modular con cada componente aislado de la versión Clean White (Navbar oficial,
              Hero Banner, Tarjeta de Producto, Filtro de Ligas, Personalizador y Concierge
              WhatsApp).
            </p>
            <div className="flex shrink-0 items-center gap-2 sm:pt-1">
              <span className="rounded-full border border-[#e6e2dc] bg-white px-3 py-1.5 text-[12px] text-[#6f6b66]">
                Fondo: #ffffff & #faf9f7
              </span>
              <span className={`${heavy} rounded-full bg-black px-3.5 py-1.5 text-[12px] font-bold text-white`}>
                Estilo Oficial Limpio
              </span>
            </div>
          </div>
          <div className="mt-8 border-t border-[#e6e2dc]" />
        </header>

        <Spec index="01" title="Header & barra de navegación oficial (desktop)" tag="Navbar Original" />
        <section className="overflow-hidden rounded-[22px] border border-[#ece8e3] bg-white shadow-[0_1px_2px_rgba(20,16,12,0.04)]">
          <p className="border-b border-[#f0ece7] py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#9a958e]">
            Envíos a toda Colombia · Pagos 100% seguros · Camisetas oficiales
          </p>
          <div className="flex items-center gap-6 px-5 py-3.5">
            <Link href="/" aria-label="Flashsport">
              <FlashMark />
            </Link>
            <nav className="flex items-center gap-6 text-[14px] text-[#3a3a3a]">
              <Link href="/" className={`${heavy} font-bold text-black underline decoration-2 underline-offset-[10px]`}>
                Inicio
              </Link>
              <Link href="/productos" className="font-medium">Tienda</Link>
              <Link href="/sobre-nosotros" className="font-medium">Nosotros</Link>
              <Link href="/contacto" className="font-medium">Contacto</Link>
            </nav>
            <div className="ml-auto flex items-center gap-3.5 text-[#2c2c2c]">
              <span className="rounded-md bg-[#f4f2ee] px-2 py-1 text-[12px] font-semibold tracking-wide text-[#4a4a4a]">
                COP ($)
              </span>
              <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <Link
                href="/carrito"
                className={`${heavy} inline-flex h-9 items-center gap-2 rounded-full bg-black pl-3.5 pr-1.5 text-[13px] font-bold text-white`}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                Carrito
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] font-bold text-black">
                  0
                </span>
              </Link>
            </div>
          </div>
        </section>

        <Spec index="02" title="Hero section & kit destacado" tag="Hero Module" />
        <section className="rounded-[24px] border border-[#ece8e3] bg-white p-6 shadow-[0_1px_2px_rgba(20,16,12,0.04)] sm:p-7">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f4f3f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f3f3f]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                Temporada oficial 2026/27
              </span>
              <h3 className={`${heavy} mt-5 text-[40px] font-extrabold uppercase leading-[0.9] tracking-[-0.045em] text-[#111] sm:text-[48px]`}>
                <span className="block whitespace-nowrap">Camisetas de fútbol</span>
                <span className="block">en Colombia</span>
              </h3>
              <p className="mt-4 max-w-[440px] text-[15px] leading-[1.55] text-[#6d6964]">
                Camisetas de fútbol de las mejores ligas del mundo.
                Equipos, temporadas y tallas reales, con envío seguro a
                todo el país y personalización con nombre y dorsal.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/productos" className={`${heavy} inline-flex h-12 items-center gap-2 rounded-full bg-black px-6 text-[13px] font-bold uppercase tracking-[0.06em] text-white`}>
                  Comprar ahora <span aria-hidden="true">→</span>
                </Link>
                <Link href="/ligas" className={`${heavy} inline-flex h-12 items-center rounded-full border border-[#e4e0da] bg-white px-6 text-[13px] font-bold uppercase tracking-[0.06em] text-[#171717]`}>
                  Explorar ligas
                </Link>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-3">
                {[
                  ["100%", "Garantizadas"],
                  ["Fan & Player", "Versiones reales"],
                  ["Nacional", "Cobertura total"],
                ].map(([title, subtitle]) => (
                  <div key={title} className="rounded-2xl border border-[#eeeae5] bg-[#fbfaf8] px-3 py-3">
                    <p className={`${heavy} text-[14px] font-extrabold text-[#171717]`}>{title}</p>
                    <p className="mt-0.5 text-[12px] text-[#8a857f]">{subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#eeeae5] bg-white p-4">
              <div className="mb-2 flex justify-end">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a958e]">
                  La Liga · 2026/27
                </span>
              </div>
              <div className="relative">
                <Photo className="h-[250px] rounded-2xl" />
                <span className={`${heavy} absolute left-3 top-3 rounded-md bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white`}>
                  Destacada -29%
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f0ece7] pt-4">
                <div>
                  <p className={`${heavy} text-[16px] font-extrabold leading-tight text-[#171717]`}>
                    FC Barcelona Visitante 2026-27
                  </p>
                  <p className="mt-1 text-[13px] text-[#8a857f]">Versión Fan & Player Match</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#b0aaa3] line-through">$120.000 COP</p>
                  <p className={`${heavy} text-[22px] font-extrabold leading-none tracking-[-0.03em] text-[#111]`}>
                    $85.000 <span className="text-[12px] font-bold tracking-normal">COP</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Spec index="03" title="Cintillo de garantías & despachos" tag="Trust Bar" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Truck, title: "Envíos a todo el país", body: "Interrapidísimo y Servientrega con número de guía." },
            { icon: ShieldCheck, title: "Pagos 100% seguros", body: "PSE, Nequi, Bancolombia y tarjetas bancarias." },
            { icon: BadgeCheck, title: "Productos de calidad", body: "Ediciones Fan y Player con bordados y vinilos HD." },
            { icon: MessageCircle, title: "Atención personalizada", body: "Asesoría directa en WhatsApp +57 304 614 9525." },
          ].map((item) => (
            <article key={item.title} className="flex gap-3 rounded-[18px] border border-[#ece8e3] bg-white p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f4f2ee] text-[#2a2a2a]">
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className={`${heavy} text-[14px] font-extrabold leading-tight text-[#171717]`}>{item.title}</p>
                <p className="mt-1 text-[12.5px] leading-[1.35] text-[#8a857f]">{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        <Spec index="04" title="Selector & filtro de ligas" tag="League Navigator" />
        <section className="rounded-[24px] border border-[#ece8e3] bg-white px-5 py-6 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a39e97]">
                Colecciones oficiales
              </p>
              <h3 className={`${heavy} mt-1 text-[28px] font-extrabold uppercase leading-none tracking-[-0.03em]`}>
                Las grandes ligas
              </h3>
            </div>
            <Link href="/productos" className={`${heavy} inline-flex items-center gap-1 text-[12px] font-extrabold uppercase tracking-[0.08em] underline decoration-1 underline-offset-4`}>
              Ver catálogo completo <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {LEAGUES.map(([name, country]) => (
              <Link
                key={name}
                href="/ligas"
                className="rounded-2xl border border-[#eeeae5] bg-white px-3 py-5 text-center"
              >
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f5f3ef]">
                  <LeagueIcon name={name} />
                </span>
                <p className={`${heavy} mt-3 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#1a1a1a]`}>
                  {name}
                </p>
                <p className="mt-0.5 text-[12px] text-[#9a958e]">{country}</p>
              </Link>
            ))}
          </div>
        </section>

        <Spec index="05" title="Tarjeta de producto (product card e-commerce)" tag="Product Card UI" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PRODUCTS.map((product) => (
            <article key={product.name} className="flex flex-col rounded-[22px] border border-[#ece8e3] bg-white p-3">
              <div className="relative">
                <Photo className="aspect-[5/4] rounded-2xl" />
                <span className={`${heavy} absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.04em] ${product.badgeClass}`}>
                  {product.badge}
                </span>
                <Heart className="absolute right-3 top-3 h-[18px] w-[18px] text-[#3a3a3a]" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a39e97]">
                {product.meta}
              </p>
              <h3 className={`${heavy} mt-1 text-[16px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#141414]`}>
                {product.name}
              </h3>
              <p className="mt-1 text-[12.5px] leading-snug text-[#8a857f]">{product.detail}</p>
              <div className="mt-4">
                {product.was ? (
                  <p className="text-[11px] text-[#b3ada6] line-through">{product.was}</p>
                ) : (
                  <p className="text-[11px] text-[#a39e97]">{product.note}</p>
                )}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className={`${heavy} whitespace-nowrap text-[18px] font-extrabold leading-none tracking-[-0.03em]`}>
                    {product.price} <span className="text-[11px] font-bold">COP</span>
                  </p>
                  <span className={`shrink-0 whitespace-nowrap ${product.statusClass}`}>{product.status}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/productos" className={`${heavy} inline-flex h-10 items-center justify-center rounded-xl border border-[#e6e2dc] text-[12px] font-extrabold uppercase tracking-[0.06em]`}>
                  Detalles
                </Link>
                <Link href="/productos" className={`${heavy} inline-flex h-10 items-center justify-center rounded-xl bg-black text-[12px] font-extrabold uppercase tracking-[0.06em] text-white`}>
                  Añadir
                </Link>
              </div>
            </article>
          ))}
        </div>

        <Spec index="06" title="Módulo de personalización (nombre & dorsal)" tag="Customizer Widget" />
        <section className="grid items-center gap-8 rounded-[24px] border border-[#ece8e3] bg-white px-6 py-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a857f]">
              <span className="text-[13px]">✎</span> Estampado oficial matchday
            </p>
            <h3 className={`${heavy} mt-4 text-[32px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] sm:text-[36px]`}>
              Personalización con nombre y número
            </h3>
            <p className="mt-3 max-w-[460px] text-[14.5px] leading-[1.5] text-[#6f6b66]">
              Agrega tu nombre, el de tu jugador favorito o fecha especial con tipografías oficiales termofijadas con acabado profesional de larga duración.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Tipografías Oficiales de Liga", "Parches de Competición", "Fijación Térmica HD"].map((chip) => (
                <span key={chip} className="rounded-full bg-[#f3f1ed] px-3 py-1.5 text-[12px] text-[#5f5b56]">
                  {chip}
                </span>
              ))}
            </div>
            <p className="mt-6 text-[13.5px] text-[#6f6b66]">
              Disponible en todas las camisetas bajo pedido:{" "}
              <span className={`${heavy} font-extrabold text-[#171717]`}>+$15.000 COP</span>
            </p>
          </div>
          <NameNumberPreview />
        </section>

        <Spec index="07" title="Módulo concierge & búsqueda por WhatsApp" tag="WhatsApp Concierge" />
        <section className="flex flex-col gap-8 rounded-[24px] border border-[#ece8e3] bg-white px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-8">
          <div className="max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eefbf3] px-3 py-1 text-[12px] font-semibold text-[#178a45]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              Servicio Concierge Directo
            </span>
            <h3 className={`${heavy} mt-4 text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] sm:text-[34px]`}>
              ¿No encuentras la camiseta que buscas?
            </h3>
            <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.5] text-[#6f6b66]">
              Tenemos acceso a muchas más camisetas, clubes exóticos, selecciones de época y
              temporadas históricas de las que publicamos. Escríbenos directamente y te ayudamos
              a conseguirla.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#3f3f3f]">
              {["Pedidos por encargo", "Las 5 grandes ligas", "Copas del Mundo y retro"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </p>
          </div>
          <div className="shrink-0 text-center lg:text-right">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`${heavy} inline-flex h-12 items-center gap-2 rounded-full bg-black px-5 text-[13px] font-bold uppercase tracking-[0.04em] text-white`}
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" fill="#25D366" />
              Consultar por WhatsApp
            </a>
            <p className="mt-2 text-[12px] text-[#8a857f]">+57 304 614 9525 · Respuesta en minutos</p>
          </div>
        </section>

        <Spec index="08" title="Footer oficial de tienda" tag="Store Footer" />
        <footer className="rounded-[24px] border border-[#ece8e3] bg-white px-6 py-7 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FlashMark />
              <p className="mt-3 max-w-[240px] text-[13px] leading-[1.45] text-[#6f6b66]">
                Curaduría y venta de camisetas oficiales de fútbol, piezas retro de colección y
                ediciones de partido con envíos asegurados a toda Colombia.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#171717]">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                100% Autenticidad Garantizada
              </p>
            </div>
            <div>
              <p className={`${heavy} text-[12px] font-extrabold uppercase tracking-[0.14em]`}>Navegación</p>
              <ul className="mt-3 space-y-2 text-[14px] text-[#4a4743]">
                <li><Link href="/">Inicio</Link></li>
                <li><Link href="/productos">Tienda (Catálogo)</Link></li>
                <li><Link href="/sobre-nosotros">Sobre Nosotros</Link></li>
                <li><Link href="/contacto">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <p className={`${heavy} text-[12px] font-extrabold uppercase tracking-[0.14em]`}>Medios de pago & envíos</p>
              <p className="mt-3 text-[13px] text-[#6f6b66]">Transacciones encriptadas y seguras:</p>
              <div className="mt-3 flex flex-nowrap gap-1.5">
                {["PSE", "Nequi", "Bancolombia", "Tarjetas"].map((method) => (
                  <span key={method} className="rounded-md bg-[#f3f1ed] px-2 py-1 text-[11px] font-semibold text-[#4a4743]">
                    {method}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-snug text-[#6f6b66]">
                Operado por Servientrega &
                <br />
                Interrapidísimo.
              </p>
            </div>
            <div>
              <p className={`${heavy} text-[12px] font-extrabold uppercase tracking-[0.14em]`}>Contacto directo</p>
              <p className={`${heavy} mt-3 text-[14px] font-extrabold`}>Medellín & Bogotá, Colombia</p>
              <p className="mt-2 text-[13.5px] text-[#4a4743]">
                WhatsApp: <span className={`${heavy} font-extrabold`}>+57 304 614 9525</span>
              </p>
              <p className="mt-1 text-[13.5px] text-[#4a4743]">
                Email: flashsport.col@gmail.com
              </p>
              <p className="mt-3 text-[13.5px] text-[#4a4743]">
                <a href="https://www.instagram.com/flashsport.col" target="_blank" rel="noopener noreferrer">Instagram</a>
                <span className="mx-2 text-[#c4bfb8]">·</span>
                <a href="https://www.tiktok.com/@flashsport.col" target="_blank" rel="noopener noreferrer">TikTok</a>
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-[#eeeae5] pt-4 text-[12.5px] text-[#8a857f] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 FLASHSPORT Colombia. Todos los derechos reservados.</p>
            <p className="flex flex-wrap gap-x-4">
              <Link href="/terminos">Términos & Condiciones</Link>
              <Link href="/cambios-devoluciones">Políticas de Devolución</Link>
              <Link href="/envios">Envíos</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
