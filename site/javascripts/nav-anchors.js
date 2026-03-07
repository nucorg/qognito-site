// Rewrite anchor-only nav links to point to the home page.
// MkDocs nav anchors (#section) are page-relative, so they break on non-home pages.
document.addEventListener("DOMContentLoaded", function () {
  var root = typeof __md_scope !== "undefined" ? __md_scope.pathname : "/";
  var onHome = window.location.pathname === root ||
               window.location.pathname === root + "index.html";
  if (onHome) return;

  document.querySelectorAll(".md-nav__link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href && href.charAt(0) === "#") {
      link.setAttribute("href", root + href);
    }
  });
});
