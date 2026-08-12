(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var storedTheme;
  try {
    storedTheme = localStorage.getItem("tanagorn-theme");
  } catch (error) {
    storedTheme = null;
  }

  if (storedTheme === "light" || storedTheme === "dark") {
    root.dataset.theme = storedTheme;
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.dataset.theme = "dark";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var themeButtons = document.querySelectorAll(".theme-toggle");
    var navToggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".primary-nav");
    var header = document.querySelector("[data-header]");

    function activeTheme() {
      return root.dataset.theme === "dark" ? "dark" : "light";
    }

    function updateThemeLabels() {
      var nextTheme = activeTheme() === "dark" ? "light" : "dark";
      themeButtons.forEach(function (button) {
        button.setAttribute("aria-label", "Switch to " + nextTheme + " theme");
        button.setAttribute("title", "Switch to " + nextTheme + " theme");
        var label = button.querySelector(".theme-label");
        if (label) label.textContent = activeTheme();
      });
    }

    updateThemeLabels();

    themeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var nextTheme = activeTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = nextTheme;
        try {
          localStorage.setItem("tanagorn-theme", nextTheme);
        } catch (error) {
          // Theme still works for this visit if storage is unavailable.
        }
        updateThemeLabels();
      });
    });

    function closeNav() {
      if (!nav || !navToggle) return;
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.querySelector("[aria-hidden='true']").textContent = "Menu";
      document.body.classList.remove("nav-open");
    }

    if (nav && navToggle) {
      navToggle.addEventListener("click", function () {
        var willOpen = !nav.classList.contains("is-open");
        nav.classList.toggle("is-open", willOpen);
        navToggle.setAttribute("aria-expanded", String(willOpen));
        navToggle.querySelector("[aria-hidden='true']").textContent = willOpen ? "Close" : "Menu";
        document.body.classList.toggle("nav-open", willOpen);
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeNav);
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 720) closeNav();
      });
    }

    function updateHeader() {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var revealItems = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
      revealItems.forEach(function (item) { revealObserver.observe(item); });
    } else {
      revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    }

    var sections = document.querySelectorAll("main section[id]");
    var sectionLinks = document.querySelectorAll(".primary-nav a[href^='#']");
    if ("IntersectionObserver" in window && sections.length && sectionLinks.length) {
      var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach(function (link) {
            var isCurrent = link.getAttribute("href") === "#" + entry.target.id;
            if (isCurrent) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-35% 0px -60%", threshold: 0 });
      sections.forEach(function (section) { sectionObserver.observe(section); });
    }

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  });
}());
