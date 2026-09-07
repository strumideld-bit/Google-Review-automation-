export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        fontFamily: "IBM Plex Sans, sans-serif",
      }}
    >
      <div>
        <h1 style={{ fontFamily: "Big Shoulders Display, sans-serif", fontWeight: 800 }}>
          Automatyzacja Opinii
        </h1>
        <p style={{ color: "var(--ink-soft)" }}>
          Ta aplikacja nie ma jednej strony głównej — każdy klient ma własny
          adres, np. <code>/demo</code>, wypisany w kodzie QR na jego
          paragonach.
        </p>
      </div>
    </main>
  );
}
