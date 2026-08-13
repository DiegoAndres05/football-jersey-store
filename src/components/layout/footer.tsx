import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Tienda",
    links: [
      { href: "/productos", label: "Catálogo" },
      { href: "/productos?liga=la-liga", label: "La Liga" },
      { href: "/productos?liga=premier-league", label: "Premier League" },
      { href: "/productos?liga=serie-a", label: "Serie A" },
      { href: "/productos?liga=liga-betplay", label: "Liga BetPlay" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "#", label: "Envíos" },
      { href: "#", label: "Cambios y devoluciones" },
      { href: "#", label: "Tallas y guía" },
      { href: "#", label: "Preguntas frecuentes" },
      { href: "#", label: "Contacto" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "#", label: "Sobre nosotros" },
      { href: "#", label: "Términos y condiciones" },
      { href: "#", label: "Política de privacidad" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <span className="text-primary">⚽</span>
              Football Jersey Store
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Camisetas de fútbol originales con envío a toda Colombia.
              Personaliza tu camiseta con el nombre y número de tu jugador favorito.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              📱 <a href="https://wa.me/573001234567" className="hover:text-foreground transition-colors">+57 300 123 4567</a>
            </p>
            <p className="text-sm text-muted-foreground">
              📧 <a href="mailto:hola@footballstore.co" className="hover:text-foreground transition-colors">hola@footballstore.co</a>
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Football Jersey Store. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Pagos seguros</span>
            <span>Envío nacional</span>
            <span>Original garantizado</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
