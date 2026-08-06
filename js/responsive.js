export function initResponsiveStatus(element) {
  const update = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width >= height ? "Horizontal" : "Vertical";
    const ratio = (width / height).toFixed(2);
    element.textContent = `${orientation} · ${width}×${height} · ${ratio}:1`;
    document.documentElement.dataset.orientation = orientation.toLowerCase();
    document.documentElement.style.setProperty("--viewport-width", `${width}px`);
    document.documentElement.style.setProperty("--viewport-height", `${height}px`);
  };

  const observer = new ResizeObserver(update);
  observer.observe(document.documentElement);
  window.addEventListener("orientationchange", update);
  update();

  return () => {
    observer.disconnect();
    window.removeEventListener("orientationchange", update);
  };
}
