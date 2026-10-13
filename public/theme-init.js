// Apply the saved appearance before the page is painted.
(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("portfolio-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch { /* Keep the default when browser storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;
})();
