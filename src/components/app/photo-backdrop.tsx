import Image from "next/image";

/**
 * Fixed, low-opacity couple photo behind every screen. Rendered once in the
 * root layout. Negative z-index + fixed positioning keeps it pinned to the
 * viewport and behind all in-flow page content — see the note on CSS
 * stacking order in docs/superpowers/specs/2026-08-02-cozy-couple-visual-theme-design.md
 * if this ever needs touching again: a negative z-index descendant paints
 * behind normal in-flow content in the same stacking context, which is
 * exactly what "fixed background" needs here.
 */
export function PhotoBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/photos/couple-2.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-10"
        style={{ objectPosition: "center 30%" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,249,252,.45)_0%,rgba(247,249,252,.85)_42%,#F7F9FC_75%)]" />
    </div>
  );
}
