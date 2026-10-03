const host = document.querySelector("[data-football]");

if (host) {
  let started = false;
  const startButton = host.querySelector("[data-football-start]");
  const hint = host.querySelector("[data-football-hint]");
  const start = async () => {
    if (started) return;
    started = true;
    const manuallyStarted = document.activeElement === startButton;
    startButton.hidden = true;
    host.dataset.state = "loading";
    hint.textContent = "Der Ball kommt ins Spiel …";
    try {
      const { mountFootball } = await import("./scene.mjs");
      await mountFootball(host);
      if (manuallyStarted) host.querySelector("[data-football-motion]").focus();
    } catch {
      host.dataset.state = "fallback";
      hint.textContent = "Ein Ball. Ein Verein. Seit 1923.";
      // The poster and ordinary page links remain usable even if the module fails.
      host.querySelector("[data-football-controls]").hidden = true;
    }
  };

  startButton.addEventListener("click", start);
  if (navigator.connection?.saveData) {
    startButton.hidden = false;
    hint.textContent = "Datensparmodus: 3D nur auf Wunsch laden.";
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(host);
  } else {
    start();
  }
}
