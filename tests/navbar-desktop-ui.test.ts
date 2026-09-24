import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const header = readFileSync("src/components/layout/header.tsx", "utf8");
const navLinks = readFileSync("src/components/layout/nav-links.tsx", "utf8");
const appLayout = readFileSync("src/components/layout/app-layout.tsx", "utf8");
const adminLayout = readFileSync("src/components/layout/admin-layout.tsx", "utf8");

test("desktop navbar exposes an accessible Radix popover with quick links", () => {
  assert.match(header, /Popover open=\{isDesktopMenuOpen\} onOpenChange=\{setIsDesktopMenuOpen\}/);
  assert.match(header, /PopoverTrigger asChild/);
  assert.match(header, /className="hidden lg:inline-flex"/);
  assert.match(header, /<Menu className="h-5 w-5" aria-hidden="true" \/>/);
  assert.match(header, /aria-label=\{isDesktopMenuOpen \? "Cerrar menú" : "Abrir menú"\}/);
  assert.match(header, /href="\/favoritos"/);
  assert.match(header, /href="\/productos#vistos-recientemente"/);
  assert.match(header, /Favoritos/);
  assert.match(header, /Vistos recientemente/);
});

test("public navigation keeps its four destinations and active semantics", () => {
  for (const href of ["/", "/productos", "/sobre-nosotros", "/contacto"]) {
    assert.match(navLinks, new RegExp(`href: "${href.replace("/", "\\/")}"`));
  }
  assert.match(navLinks, /pathname === item\.href/);
  assert.match(navLinks, /pathname\.startsWith\(item\.href\)/);
  assert.match(navLinks, /aria-current=\{isActive \? "page" : undefined\}/);
});

test("desktop and mobile navigation states are synchronized at the lg breakpoint", () => {
  assert.match(header, /matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(header, /setIsMobileOpen\(false\)/);
  assert.match(header, /setIsDesktopMenuOpen\(false\)/);
  assert.match(header, /lg:hidden/);
  assert.match(header, /hidden lg:inline-flex/);
});

test("public header boundary remains separate from admin layout", () => {
  assert.match(appLayout, /<Header currencySlot=/);
  assert.doesNotMatch(adminLayout, /<Header/);
  assert.doesNotMatch(adminLayout, /Popover/);
});

test("public header stays fixed to the viewport and reserves its row height", () => {
  assert.match(header, /fixed top-0 inset-x-0 w-full/);
  assert.doesNotMatch(header, /sticky top-0/);
  assert.match(header, /aria-hidden="true" className="h-16 md:h-\[4\.5rem\]"/);
  assert.doesNotMatch(adminLayout, /<Header/);
});
