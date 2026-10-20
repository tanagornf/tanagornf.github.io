(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function bangkokTime() {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  }

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function isTyping(target) {
    return (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    );
  }

  /* Hero stickers and globe */
  function initStickers() {
    var visual = document.querySelector(".hero-visual");
    var art = document.querySelector(".systems-art");
    var globe = document.querySelector("[data-globe]");
    var stickers = document.querySelectorAll("[data-sticker]");
    if (!visual || !art) return { stickers: [], globe: null };

    stickers.forEach(function (el) {
      var transform = getComputedStyle(el).transform;
      var matrix = new DOMMatrixReadOnly(
        transform && transform !== "none" ? transform : undefined,
      );
      el.dataset.rot = String(
        Math.round((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI),
      );

      var startX, startY, startLeft, startTop, lastX, dragging = false;

      el.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        try {
          el.setPointerCapture(event.pointerId);
        } catch (error) {
          // Dragging still works without capture.
        }
        dragging = true;
        visual.classList.add("is-playing");
        el.classList.add("is-dragging");
        startLeft = el.offsetLeft;
        startTop = el.offsetTop;
        el.style.left = startLeft + "px";
        el.style.top = startTop + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";
        startX = lastX = event.clientX;
        startY = event.clientY;
      });

      el.addEventListener("pointermove", function (event) {
        if (!dragging) return;
        var maxLeft = art.offsetWidth - el.offsetWidth * 0.6;
        var maxTop = art.offsetHeight - el.offsetHeight * 0.6;
        var left = clamp(
          startLeft + event.clientX - startX,
          -el.offsetWidth * 0.4,
          maxLeft,
        );
        var top = clamp(
          startTop + event.clientY - startY,
          -el.offsetHeight * 0.4,
          maxTop,
        );
        var tilt = clamp((event.clientX - lastX) * 1.4, -18, 18);
        lastX = event.clientX;
        el.style.left = left + "px";
        el.style.top = top + "px";
        el.style.transform =
          "rotate(" + (Number(el.dataset.rot) + tilt) + "deg) scale(1.07)";
      });

      function drop() {
        if (!dragging) return;
        dragging = false;
        el.classList.remove("is-dragging");
        el.dataset.rot = String(Math.round(rand(-9, 9)));
        el.style.transform = "rotate(" + el.dataset.rot + "deg)";
        visual.classList.remove("is-playing");
      }

      el.addEventListener("pointerup", drop);
      el.addEventListener("pointercancel", drop);
    });

    var spin = 0;
    if (globe) {
      globe.addEventListener("click", function () {
        spin += 360;
        globe.style.setProperty("--spin", spin + "deg");
        if (reduceMotion) return;
        globe.style.setProperty("--sx", "1.14");
        globe.style.setProperty("--sy", "0.86");
        window.setTimeout(function () {
          globe.style.setProperty("--sx", "1");
          globe.style.setProperty("--sy", "1");
        }, 200);
      });
    }

    return { stickers: Array.prototype.slice.call(stickers), globe: globe };
  }

  /* Resize reactions, desktop only */
  function initSquish(hero) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    var bubble = make("div", "squish-bubble");
    bubble.setAttribute("aria-hidden", "true");
    var face = make("b");
    var words = make("span");
    bubble.append(face, words);
    document.body.appendChild(bubble);

    var lastWidth = window.innerWidth;
    var squish = 0;
    var stopTimer, hideTimer;

    function mood(width) {
      if (width < 520) return ["(×_×)", "too squished!"];
      if (width < 760) return ["(>_<)", "it’s getting tight in here"];
      if (width < 1100) return ["(•_•)", "this is fine"];
      return ["\\(^o^)/", "room to breathe!"];
    }

    window.addEventListener("resize", function () {
      var width = window.innerWidth;
      var change = width - lastWidth;
      lastWidth = width;
      if (change === 0) return;

      var current = mood(width);
      // Mini-me says it when it's on screen; otherwise the corner bubble does.
      var said = { face: current[0], words: current[1], handled: false };
      document.dispatchEvent(new CustomEvent("tf:squish", { detail: said }));
      if (!said.handled) {
        face.textContent = current[0];
        words.textContent = current[1];
        bubble.classList.add("is-on");
      }

      if (!reduceMotion) {
        squish = clamp(squish * 0.6 + (-change / 30) * 0.4, -0.22, 0.22);
        if (hero.globe) {
          hero.globe.classList.add("is-squishing");
          hero.globe.style.setProperty("--sx", String(1 - squish));
          hero.globe.style.setProperty("--sy", String(1 + squish));
        }
        hero.stickers.forEach(function (el, index) {
          if (el.classList.contains("is-dragging")) return;
          var lean = (index % 2 ? 1 : -1) * squish * 70;
          el.style.transform =
            "rotate(" + (Number(el.dataset.rot) + lean) + "deg)";
        });
      }

      window.clearTimeout(stopTimer);
      window.clearTimeout(hideTimer);
      stopTimer = window.setTimeout(function () {
        squish = 0;
        if (hero.globe) {
          hero.globe.classList.remove("is-squishing");
          hero.globe.style.setProperty("--sx", "1");
          hero.globe.style.setProperty("--sy", "1");
        }
        hero.stickers.forEach(function (el) {
          el.style.transform = "rotate(" + el.dataset.rot + "deg)";
        });
      }, 180);
      hideTimer = window.setTimeout(function () {
        bubble.classList.remove("is-on");
      }, 1500);
    });
  }

  /* Mini Roster Companion */
  function initRoster() {
    var root = document.querySelector("[data-roster]");
    if (!root) return;
    var media = root.closest(".roster-media");
    var list = root.querySelector("[data-roster-list]");
    var email = root.querySelector("[data-roster-email]");
    var confirmBox = root.querySelector("[data-roster-confirm]");
    var confirmText = root.querySelector("[data-roster-confirm-text]");
    var steps = root.querySelector("[data-roster-steps]");
    var goButton = root.querySelector("[data-roster-go]");
    var cancelButton = root.querySelector("[data-roster-cancel]");
    var useButton = root.querySelector("[data-roster-use]");
    var refreshButton = root.querySelector("[data-roster-refresh]");
    var status = root.querySelector("[data-roster-status]");

    var accounts = [
      { name: "Personal", plan: "Pro", email: "alex@example.com", h5: 78, wk: 61, reset: "Tuesday at 6:50 AM" },
      { name: "Lab", plan: "Team", email: "lab@example.com", h5: 92, wk: 84, reset: "Friday at 7:50 AM" },
      { name: "Work", plan: "Plus", email: "work@example.com", h5: 46, wk: 33, reset: "Thursday at 4:50 AM" },
    ];
    var active = 0;
    var pending = null;
    var busy = false;

    function render(flashIndex) {
      list.textContent = "";
      accounts.forEach(function (account, index) {
        var item = make("li", "rm-item");
        if (index === active) item.classList.add("is-active");
        if (index === flashIndex) item.classList.add("is-flash");

        var name = make("span", "rm-name", account.name);
        name.appendChild(make("span", "rm-plan", account.plan));
        var side = make("span", "rm-side");
        if (index === active) {
          side.appendChild(make("span", "rm-active", "Active"));
        } else {
          var change = make("button", "", "Change Account");
          change.type = "button";
          change.disabled = busy;
          change.addEventListener("click", function () {
            askToChange(index);
          });
          side.appendChild(change);
        }
        var usage = make(
          "span",
          "rm-usage",
          account.h5 > 0
            ? "5h: " + account.h5 + "% · Weekly: " + account.wk + "%"
            : "5h limit reached · Weekly: " + account.wk + "%",
        );
        if (account.h5 <= 0) usage.classList.add("is-out");

        item.append(
          name,
          side,
          make("span", "rm-email", account.email),
          usage,
          make("span", "rm-reset", "Weekly resets " + account.reset),
        );
        list.appendChild(item);
      });
      email.textContent = accounts[active].email;
      useButton.disabled = busy || accounts[active].h5 <= 0;
      refreshButton.disabled = busy;
      if (flashIndex != null)
        window.setTimeout(function () {
          var flashed = list.children[flashIndex];
          if (flashed) flashed.classList.remove("is-flash");
        }, 900);
    }

    function askToChange(index) {
      pending = index;
      confirmText.textContent =
        "Change to " +
        accounts[index].name +
        " (" +
        accounts[index].email +
        ")? ChatGPT will close and reopen.";
      steps.textContent = "";
      goButton.disabled = false;
      cancelButton.disabled = false;
      confirmBox.hidden = false;
      goButton.focus({ preventScroll: true });
    }

    cancelButton.addEventListener("click", function () {
      pending = null;
      confirmBox.hidden = true;
    });

    goButton.addEventListener("click", function () {
      if (pending == null) return;
      var target = pending;
      var labels = [
        "Checking for running tasks",
        "Backing up the current session",
        "Validating " + accounts[target].name + " credentials",
        "Reopening ChatGPT",
      ];
      busy = true;
      goButton.disabled = true;
      cancelButton.disabled = true;
      render();
      status.textContent = "Changing account…";
      labels.forEach(function (label, i) {
        window.setTimeout(function () {
          if (steps.lastElementChild)
            steps.lastElementChild.classList.add("is-done");
          steps.appendChild(make("li", "", label));
        }, i * 480);
      });
      window.setTimeout(function () {
        steps.lastElementChild.classList.add("is-done");
      }, labels.length * 480);
      window.setTimeout(function () {
        active = target;
        pending = null;
        busy = false;
        confirmBox.hidden = true;
        status.textContent = "Changed to " + accounts[target].name;
        render(target);
      }, labels.length * 480 + 450);
    });

    useButton.addEventListener("click", function () {
      var account = accounts[active];
      account.h5 = Math.max(0, account.h5 - Math.round(rand(9, 15)));
      account.wk = Math.max(0, account.wk - Math.round(rand(2, 4)));
      status.textContent =
        account.h5 > 0
          ? "Prompt sent · usage updated"
          : "5h limit reached. Change account?";
      render();
    });

    refreshButton.addEventListener("click", function () {
      status.textContent = "Refreshing…";
      refreshButton.disabled = true;
      window.setTimeout(function () {
        status.textContent = "Usage updated";
        refreshButton.disabled = false;
      }, 700);
    });

    render();
    root.hidden = false;
    media.classList.add("has-mini");
  }

  /* Blocky avatars shared by the mini game and the site's mini-me. Units are game pixels; the
     caller scales the context. (x, y) is the point between the feet. */
  var LOOKS = {
    // From Tanagorn's photos: near-black hair with a fringe, light skin, charcoal polo, beige trousers.
    tanagorn: {
      skin: "#f2cfae", skinShade: "#e2b993", hair: "#1f1814", hairLight: "#3b2c24",
      shirt: "#363b36", shirtShade: "#2b2f2b", collar: "#4a504a", sleeve: true,
      pants: "#d8cab0", pantsShade: "#c2b394", shoes: "#2a2a2a", hairStyle: "fringe",
    },
    guard: {
      skin: "#f5cd30", skinShade: "#e0b820", shirt: "#c9a45c", shirtShade: "#a8843f",
      pants: "#5f4a30", pantsShade: "#4d3c27", shoes: "#2a2218", hat: "#3b2e22", belt: "#5f4a30", badge: "#ffd24a",
    },
  };

  function drawBlocky(ctx, x, y, look, pose) {
    var dir = pose.dir || "down";
    var side = dir === "left" || dir === "right";
    var t = (pose.walk || 0) * 14;
    var swing = pose.moving ? Math.sin(t) * 3 : 0;
    var bob = pose.moving ? Math.abs(Math.sin(t)) * 1.2 : 0;
    var wave = pose.wave ? Math.sin(pose.wave * 12) : null;
    function box(color, bx, by, w, h) {
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, w, h);
    }

    if (!pose.noShadow) {
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // legs and shoes
    if (pose.sitting) {
      box(look.pants, x - 6, y - 10, 5, 6);
      box(look.pants, x + 1, y - 10, 5, 6);
      box(look.pantsShade, x - 6, y - 5, 5, 5);
      box(look.pantsShade, x + 1, y - 5, 5, 5);
      box(look.shoes, x - 6, y - 1, 5, 2);
      box(look.shoes, x + 1, y - 1, 5, 2);
    } else if (side) {
      box(look.pantsShade, x - 1 - swing * 0.6, y - 10, 5, 10);
      box(look.pants, x - 4 + swing * 0.6, y - 10, 5, 10);
      box(look.shoes, x - 4 + swing * 0.6, y - 2, 5, 2);
      box(look.shoes, x - 1 - swing * 0.6, y - 2, 5, 2);
    } else {
      var l = Math.max(0, swing) * 0.4;
      var r = Math.max(0, -swing) * 0.4;
      box(look.pants, x - 6, y - 10 + l, 5, 10 - l);
      box(look.pants, x + 1, y - 10 + r, 5, 10 - r);
      box(look.pantsShade, x - 1, y - 10, 2, 3);
      box(look.shoes, x - 6, y - 2, 5, 2);
      box(look.shoes, x + 1, y - 2, 5, 2);
    }

    var top = y - 22 - bob;
    // torso and arms
    if (side) {
      box(look.shirt, x - 5, top, 10, 12);
      box(look.shirtShade, x - 2 + swing, top + 1, 4, look.sleeve ? 5 : 10);
      box(look.skin, x - 2 + swing, top + (look.sleeve ? 6 : 10), 4, look.sleeve ? 6 : 2);
    } else {
      var lift = wave === null ? 0 : 1;
      if (pose.ears) {
        // both hands clamped over the ears
        box(look.shirtShade, x - 11, top - 2, 4, 5);
        box(look.shirtShade, x + 7, top - 2, 4, 5);
        box(look.skin, x - 10, top - 9, 4, 7);
        box(look.skin, x + 6, top - 9, 4, 7);
        lift = -1;
      } else {
        // left arm (viewer's left)
        box(look.shirtShade, x - 11, top + 1 - swing * 0.3, 4, look.sleeve ? 5 : 10);
        box(look.skin, x - 11, top + (look.sleeve ? 6 : 10) - swing * 0.3, 4, look.sleeve ? 6 : 2);
      }
      // right arm, raised and waving when asked
      if (lift === -1) {
        // already drawn
      } else if (lift) {
        var wx = x + 8 + wave * 1.5;
        box(look.shirtShade, x + 7, top - 2, 4, 5);
        box(look.skin, wx, top - 10, 4, 9);
      } else {
        box(look.shirtShade, x + 7, top + 1 + swing * 0.3, 4, look.sleeve ? 5 : 10);
        box(look.skin, x + 7, top + (look.sleeve ? 6 : 10) + swing * 0.3, 4, look.sleeve ? 6 : 2);
      }
      box(look.shirt, x - 7, top, 14, 12);
      if (look.collar && dir === "down") {
        box(look.collar, x - 4, top, 3, 2);
        box(look.collar, x + 1, top, 3, 2);
        box(look.shirtShade, x - 0.5, top + 2, 1, 4);
        box(look.skin, x - 1, top, 2, 2);
      }
      if (look.belt) box(look.belt, x - 7, top + 9, 14, 2);
      if (look.badge && dir === "down") box(look.badge, x + 2, top + 3, 3, 3);
    }

    // head
    var hx = x - 5;
    var hy = top - 10;
    box(look.skin, hx, hy, 10, 10);
    box(look.skinShade, hx, hy + 8, 10, 2);
    if (look.hat) {
      box(look.hat, hx - 1, hy - 3, 12, 5);
      if (dir !== "up") box(look.hat, dir === "left" ? hx - 4 : dir === "right" ? hx + 5 : hx - 1, hy + 1, 9, 2);
      if (dir === "down") box(look.badge, hx + 4, hy - 2, 2, 2);
    } else if (look.hairStyle === "fringe") {
      box(look.hair, hx - 1, hy - 3, 12, 4);
      box(look.hairLight, hx + 1, hy - 3, 6, 1);
      if (dir === "up") box(look.hair, hx - 1, hy - 3, 12, 11);
      else if (side) {
        box(look.hair, dir === "left" ? hx + 4 : hx - 1, hy - 3, 7, 8);
        box(look.hair, dir === "left" ? hx - 1 : hx + 7, hy, 4, 2);
      } else {
        // fringe down to the brows, a little uneven, with hair over the ears
        box(look.hair, hx - 1, hy, 12, 2);
        box(look.hair, hx + 1, hy + 2, 2, 1);
        box(look.hair, hx + 5, hy + 2, 3, 1);
        box(look.hair, hx - 1, hy, 2, 6);
        box(look.hair, hx + 9, hy, 2, 6);
      }
    }
    if (pose.ears && !side) {
      box(look.skin, x - 10, top - 8, 3, 6);
      box(look.skin, x + 7, top - 8, 3, 6);
    }
    if (dir === "down" && pose.eyesClosed) {
      box("#1a1412", hx + 2, hy + 5, 2, 1);
      box("#1a1412", hx + 6, hy + 5, 2, 1);
      box("#a5574a", hx + 4, hy + 7, 2, 1);
    } else if (dir === "down") {
      box("#1a1412", hx + 2, hy + 4, 2, 2);
      box("#1a1412", hx + 6, hy + 4, 2, 2);
      box("rgba(255,255,255,.7)", hx + 2, hy + 4, 1, 1);
      box("rgba(255,255,255,.7)", hx + 6, hy + 4, 1, 1);
      if (pose.smile) {
        box("#a5574a", hx + 3, hy + 7, 4, 1);
        box("#a5574a", hx + 2, hy + 6, 1, 1);
        box("#a5574a", hx + 7, hy + 6, 1, 1);
      } else box("#a5574a", hx + 3, hy + 7, 4, 1);
    } else if (side) {
      box("#1a1412", dir === "left" ? hx + 1 : hx + 7, hy + 4, 2, 2);
    }
  }

  /* Hack A Country, in miniature: one run in Italy. Crossing the yellow line wakes the guard. */
  function initHackACountry() {
    var root = document.querySelector("[data-hac]");
    if (!root) return null;
    var media = root.closest(".feature-media");
    var canvas = root.querySelector("[data-hac-canvas]");
    var ctx = canvas.getContext("2d");
    var banner = root.querySelector("[data-hac-banner]");
    var hackButton = root.querySelector("[data-hac-hack]");
    var hackLabel = root.querySelector("[data-hac-hack-label]");
    var hackFill = root.querySelector("[data-hac-progress]");
    var bag = root.querySelector("[data-hac-bag]");
    var bagFill = root.querySelector("[data-hac-bag-fill]");
    var bagLabel = root.querySelector("[data-hac-bag-label]");
    var panel = root.querySelector("[data-hac-panel]");
    var title = root.querySelector("[data-hac-title]");
    var sub = root.querySelector("[data-hac-sub]");
    var help = root.querySelector("[data-hac-help]");
    var goButton = root.querySelector("[data-hac-go]");
    var robloxLink = root.querySelector("[data-hac-roblox]");

    // Italy's Easy Civic Office from the game's Config: 35 files, guard speed 12.
    var FILES = 35;
    var GUARD_SPEED_LABEL = 12;
    var HACK_SECONDS = 1.4;
    var PLAYER_SPEED = 112;
    var GUARD_SPEED = 64;
    var WAKE_DELAY = 0.8;

    var W = 360;
    var H = 480;
    var K = 0.74; // ground foreshortening for the angled view
    var LINE_Y = 268;
    var HOME_Y = 424;
    var RADIUS = 8;
    var DESK = { x: 156, y: 80, w: 48, h: 22 };
    var TERMINAL = { x: 180, y: 92 };
    var POST = { x: 66, y: 240 };
    var OFFICE = { x: 100, y: 30, w: 160, h: 140 };
    var DOORS = [
      { x: 180, y: 166, out: 1 },
      { x: 180, y: 34, out: -1 },
    ];
    var WALLS = [
      { x: 100, y: 30, w: 58, h: 8, z: 26 },
      { x: 202, y: 30, w: 58, h: 8, z: 26 },
      { x: 100, y: 30, w: 8, h: 140, z: 26 },
      { x: 252, y: 30, w: 8, h: 140, z: 26 },
      { x: 100, y: 162, w: 58, h: 8, z: 26 },
      { x: 202, y: 162, w: 58, h: 8, z: 26 },
    ];
    var SOLIDS = WALLS.concat([DESK]);
    var CORNERS = [
      { x: 86, y: 16 },
      { x: 274, y: 16 },
      { x: 86, y: 186 },
      { x: 274, y: 186 },
    ];
    var TREES = [
      [54, 74], [70, 150], [300, 64], [316, 140], [298, 312], [62, 340], [312, 384],
      [-40, 40], [-96, 150], [-52, 268], [-120, 360], [-64, 450], [404, 92], [452, 212], [392, 300], [470, 404], [420, 470],
    ];

    var game = null;
    var keys = {};
    var pointerTarget = null;
    var hacking = false;
    var frame = 0;
    var last = 0;
    var view = { scale: 1, x: 0, y: 0, width: 0, height: 0, dpr: 1 };

    function newRun() {
      game = {
        player: { x: 180, y: 452, dir: "up", moving: false, walk: 0 },
        guard: { x: POST.x, y: POST.y, dir: "right", moving: false, walk: 0, awake: false, wokeAt: 0 },
        progress: 0,
        carrying: 0,
        time: 0,
        over: false,
        floats: [],
        confetti: [],
        flash: 0,
      };
      hacking = false;
      pointerTarget = null;
    }

    /* Geometry */
    function hitsSolid(x, y, r) {
      for (var i = 0; i < SOLIDS.length; i++) {
        var w = SOLIDS[i];
        var cx = clamp(x, w.x, w.x + w.w);
        var cy = clamp(y, w.y, w.y + w.h);
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
      }
      return x < 36 + r || x > W - r || y < r || y > H - r;
    }

    function move(body, dx, dy) {
      if (dx && !hitsSolid(body.x + dx, body.y, RADIUS)) body.x += dx;
      if (dy && !hitsSolid(body.x, body.y + dy, RADIUS)) body.y += dy;
      body.moving = !!(dx || dy);
      if (body.moving)
        body.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    }

    function inside(p) {
      return p.x > 108 && p.x < 252 && p.y > 38 && p.y < 162;
    }

    function dist(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function segmentHitsOffice(a, b) {
      for (var i = 1; i <= 12; i++) {
        var t = i / 13;
        var x = a.x + (b.x - a.x) * t;
        var y = a.y + (b.y - a.y) * t;
        if (x > OFFICE.x - 2 && x < OFFICE.x + OFFICE.w + 2 && y > OFFICE.y - 2 && y < OFFICE.y + OFFICE.h + 2)
          return true;
      }
      return false;
    }

    function guardTarget(g, p) {
      if (inside(g) !== inside(p)) {
        var best = DOORS[0];
        var bestCost = Infinity;
        DOORS.forEach(function (door) {
          var cost = dist(g, door) + dist(door, p);
          if (cost < bestCost) {
            bestCost = cost;
            best = door;
          }
        });
        var side = inside(g) ? -best.out : best.out;
        if (Math.abs(g.x - best.x) < 5 && Math.abs(g.y - best.y) <= 24)
          return { x: best.x, y: best.y - side * 22 };
        return { x: best.x, y: best.y + side * 22 };
      }
      if (!inside(g) && segmentHitsOffice(g, p)) {
        var corner = null;
        var cornerCost = Infinity;
        CORNERS.forEach(function (c) {
          if (segmentHitsOffice(g, c)) return;
          var cost = dist(g, c) + dist(c, p);
          if (cost < cornerCost) {
            cornerCost = cost;
            corner = c;
          }
        });
        if (corner) return corner;
      }
      return p;
    }

    /* HUD */
    function setState(state) {
      root.dataset.state = state;
      media.classList.toggle("is-playing", state !== "cover");
    }

    function nearTerminal() {
      return dist(game.player, TERMINAL) < 52;
    }

    function updateHud() {
      var done = game.carrying > 0;
      hackButton.hidden = done;
      bag.hidden = !done;
      hackButton.disabled = !nearTerminal() || done;
      hackButton.classList.toggle("is-down", hacking && nearTerminal());
      hackFill.style.width = (game.progress / HACK_SECONDS) * 100 + "%";
      if (done) {
        bagFill.style.width = "100%";
        bagLabel.textContent = "BAG " + FILES + " / " + FILES + " • GO HOME";
      } else if (hacking && nearTerminal()) {
        hackLabel.textContent = "HACKING… " + Math.floor((game.progress / HACK_SECONDS) * 100) + "%";
      } else if (game.progress > 0) {
        hackLabel.textContent = "RESUME • " + Math.floor((game.progress / HACK_SECONDS) * 100) + "%";
      } else {
        hackLabel.textContent = nearTerminal() ? "HOLD HACK [E]" : "WALK TO THE TERMINAL";
      }

      var text;
      var alert = game.guard.awake;
      if (done) text = "GUARD ALERT • RUN HOME!";
      else if (alert) text = "GUARD ALERT • Italy • " + GUARD_SPEED_LABEL + " speed";
      else if (game.player.y > LINE_Y) text = "Italy • Easy Civic Office • the yellow line wakes the guard";
      else text = "Italy • Easy Civic Office • " + FILES + " files";
      if (banner.textContent !== text) banner.textContent = text;
      banner.classList.toggle("is-alert", alert);
    }

    function showPanel(kind) {
      panel.hidden = false;
      help.hidden = true;
      title.className = "hac-title";
      robloxLink.hidden = kind !== "banked";
      if (kind === "banked") {
        title.classList.add("is-good");
        title.textContent = "BANKED +" + FILES + " DATA";
        sub.textContent =
          "Italy hacked in " + game.time.toFixed(1) + " s. The real game keeps going: five more countries, upgrades, plots, cars and planes.";
        goButton.textContent = "↻ PLAY AGAIN";
      } else {
        title.classList.add("is-bad");
        title.textContent = "CAPTURED";
        sub.textContent =
          "The guard wakes the moment you cross the yellow line. Hack fast, then shake it off through the back door.";
        goButton.textContent = "↻ TRY AGAIN";
      }
    }

    function finish(kind) {
      game.over = true;
      hacking = false;
      document.dispatchEvent(new CustomEvent("tf:game", { detail: kind }));
      if (kind === "banked") {
        for (var i = 0; i < 70; i++) {
          game.confetti.push({
            x: game.player.x,
            y: game.player.y,
            z: 10,
            vx: rand(-90, 90),
            vy: rand(-60, 40),
            vz: rand(80, 200),
            color: ["#ffbf26", "#6eb620", "#0086de", "#ac00e8", "#ffffff"][i % 5],
            life: rand(1, 1.8),
          });
        }
      } else game.flash = 1;
      setState("result");
      updateHud();
      showPanel(kind);
      settle(performance.now());
      goButton.focus({ preventScroll: true });
    }

    // Let confetti and the red flash play out after the run ends.
    function settle(start) {
      var lastSettle = start;
      function frameFn(now) {
        var dt = Math.min(0.05, (now - lastSettle) / 1000);
        lastSettle = now;
        stepEffects(dt);
        draw();
        if (now - start < 2200 && root.dataset.state === "result") window.requestAnimationFrame(frameFn);
      }
      window.requestAnimationFrame(frameFn);
    }

    function start() {
      newRun();
      panel.hidden = true;
      setState("playing");
      resize();
      updateHud();
      canvas.focus({ preventScroll: true });
      last = 0;
      if (!frame) frame = window.requestAnimationFrame(tick);
    }

    /* Simulation */
    function stepEffects(dt) {
      game.floats = game.floats.filter(function (f) {
        f.age += dt;
        return f.age < f.life;
      });
      game.confetti = game.confetti.filter(function (c) {
        c.life -= dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vz -= 420 * dt;
        c.z = Math.max(0, c.z + c.vz * dt);
        return c.life > 0;
      });
      game.flash = Math.max(0, game.flash - dt * 1.6);
    }

    function step(dt) {
      var p = game.player;
      var g = game.guard;
      game.time += dt;

      var dx = 0;
      var dy = 0;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (!dx && !dy && pointerTarget) {
        var tx = pointerTarget.x - p.x;
        var ty = pointerTarget.y - p.y;
        var d = Math.hypot(tx, ty);
        if (d > 4) {
          dx = tx / d;
          dy = ty / d;
        }
      }

      if (hacking && nearTerminal() && game.carrying === 0) {
        p.moving = false;
        p.dir = "up";
        game.progress = Math.min(HACK_SECONDS, game.progress + dt);
        if (Math.random() < dt * 14)
          game.floats.push({ x: TERMINAL.x + rand(-16, 16), y: TERMINAL.y, z: 26, text: Math.random() < 0.5 ? "0" : "1", age: 0, life: 0.8, color: "#3fe0f0", size: 10 });
        if (game.progress >= HACK_SECONDS) {
          game.carrying = FILES;
          hacking = false;
          game.floats.push({ x: p.x, y: p.y, z: 40, text: "+" + FILES + " DATA", age: 0, life: 1.4, color: "#ffbf26", size: 16 });
        }
      } else {
        var len = Math.hypot(dx, dy);
        if (len) move(p, (dx / len) * PLAYER_SPEED * dt, (dy / len) * PLAYER_SPEED * dt);
        else p.moving = false;
      }
      if (p.moving) p.walk += dt;

      if (!g.awake && p.y < LINE_Y) {
        g.awake = true;
        g.wokeAt = game.time;
      }
      if (g.awake && game.time - g.wokeAt > WAKE_DELAY) {
        var target = guardTarget(g, p);
        var gx = target.x - g.x;
        var gy = target.y - g.y;
        var gd = Math.hypot(gx, gy);
        if (gd > 0.5) {
          var stepLength = Math.min(gd, GUARD_SPEED * dt);
          move(g, (gx / gd) * stepLength, (gy / gd) * stepLength);
          g.walk += dt;
        } else g.moving = false;
        if (dist(g, p) < 15) {
          finish("caught");
          return;
        }
      } else if (g.awake) {
        g.dir = p.x > g.x ? "right" : "left";
      }

      if (p.y > HOME_Y && game.carrying > 0) {
        finish("banked");
        return;
      }
      stepEffects(dt);
      updateHud();
    }

    function tick(now) {
      frame = 0;
      if (!game || game.over || root.dataset.state !== "playing") return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (onScreen() && !document.hidden) step(dt);
      else {
        last = 0;
        keys = {};
        hacking = false;
      }
      if (game.over) return;
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    /* Drawing: an angled view, every part drawn as a block with a top and a front face */
    function resize() {
      var rect = root.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      view.width = rect.width;
      view.height = rect.height;
      view.dpr = dpr;
      // Keep the map clear of the banner on top and the hack button / bag bar below.
      var topRoom = 44;
      var bottomRoom = 74;
      var worldHeight = H * K + 60;
      var room = Math.max(120, rect.height - topRoom - bottomRoom);
      view.scale = Math.min((rect.width - 16) / W, room / worldHeight);
      view.x = (rect.width - W * view.scale) / 2;
      view.y = topRoom + (room - worldHeight * view.scale) / 2 + 60 * view.scale;
      if (game) draw();
    }

    function fill(color) {
      ctx.fillStyle = color;
    }

    function box(x, y, w, d, z, top, front, base) {
      var b = base || 0;
      fill(front);
      ctx.fillRect(x, (y + d) * K - z, w, z - b);
      fill(top);
      ctx.fillRect(x, y * K - z, w, d * K);
    }

    function shade(hex, amount) {
      var n = parseInt(hex.slice(1), 16);
      var r = clamp(((n >> 16) & 255) + amount, 0, 255);
      var g = clamp(((n >> 8) & 255) + amount, 0, 255);
      var b = clamp((n & 255) + amount, 0, 255);
      return "rgb(" + r + "," + g + "," + b + ")";
    }

    function studs(x, y, w, d, color, gap) {
      fill(color);
      for (var sy = y + gap / 2; sy < y + d; sy += gap)
        for (var sx = x + gap / 2; sx < x + w; sx += gap) ctx.fillRect(sx - 1.5, sy * K - 1, 3, 2);
    }

    function text(str, x, y, size, color, stroke) {
      ctx.font = "800 " + size + "px 'Arial Rounded MT Bold', Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke || "#101418";
      ctx.lineWidth = Math.max(2, size / 3.2);
      ctx.strokeText(str, x, y);
      fill(color || "#fff");
      ctx.fillText(str, x, y);
    }

    function drawGround() {
      fill("#5cc23a");
      ctx.fillRect(-600, -60, W + 1200, H * K + 200);
      studs(-600, -60 / K, W + 1200, H + 200, "rgba(255,255,255,.08)", 14);
      // river
      fill("#4cc6ee");
      ctx.fillRect(0, -60, 30, H * K + 120);
      fill("rgba(255,255,255,.35)");
      for (var wy = 10; wy < H; wy += 26) ctx.fillRect(6 + ((wy / 26) % 2) * 8, wy * K, 10, 2);
      fill("#a9e6c0");
      ctx.fillRect(30, -60, 5, H * K + 120);
      // road
      fill("#9aaccb");
      ctx.fillRect(148, -60, 64, H * K + 120);
      fill("#8799b8");
      ctx.fillRect(148, -60, 3, H * K + 120);
      ctx.fillRect(209, -60, 3, H * K + 120);
      studs(150, -60 / K, 60, H + 120, "rgba(255,255,255,.18)", 12);
      // home plot pad
      fill("#2fae55");
      ctx.fillRect(40, HOME_Y * K, 280, (H - HOME_Y) * K + 30);
      fill("#3ccf6a");
      ctx.fillRect(44, (HOME_Y + 4) * K, 272, (H - HOME_Y) * K + 30);
      fill("rgba(255,255,255,.2)");
      for (var hx = 48; hx < 316; hx += 22) ctx.fillRect(hx, (HOME_Y + 4) * K, 11, (H - HOME_Y) * K + 30);
      // yellow wake line
      box(40, LINE_Y - 4, 280, 8, 2, "#ffd84a", "#d8a917");
      // guard post
      box(POST.x - 18, POST.y - 18, 36, 36, 3, "#e8473f", "#a92a24");
      fill("rgba(255,255,255,.35)");
      ctx.fillRect(POST.x - 12, (POST.y - 12) * K - 3, 24, 2);
    }

    function drawFlag(x, y) {
      fill("#7a7f86");
      ctx.fillRect(x, y - 44, 2, 44);
      var colors = ["#2a9a4a", "#ffffff", "#d8312c"];
      var wave = Math.sin(performance.now() / 300) * 1.5;
      colors.forEach(function (color, i) {
        fill(color);
        ctx.fillRect(x + 2 + i * 7, y - 44 + (i === 1 ? wave * 0.5 : i === 2 ? wave : 0), 7.5, 14);
      });
    }

    function drawOffice(layer) {
      var wall = "#f1e4c8";
      var wallFront = "#e3d2ad";
      var roof = "#c8553d";
      if (layer === "floor") {
        fill("#dfe6ee");
        ctx.fillRect(OFFICE.x + 8, (OFFICE.y + 8) * K, OFFICE.w - 16, (OFFICE.h - 16) * K);
        fill("#f4f7fa");
        for (var ty = OFFICE.y + 8; ty < OFFICE.y + OFFICE.h - 8; ty += 12)
          for (var tx = OFFICE.x + 8; tx < OFFICE.x + OFFICE.w - 8; tx += 12)
            ctx.fillRect(tx + 1, ty * K + 1, 10, 12 * K - 2);
        // green guide stripe on the floor, as in the game
        fill("#2fa84f");
        ctx.fillRect(OFFICE.x + 8, (OFFICE.y + 120) * K, OFFICE.w - 16, 2);
        // doormats
        fill("#1f2b4f");
        ctx.fillRect(160, 166 * K - 1, 40, 4);
        ctx.fillRect(160, 34 * K - 1, 40, 4);
        return;
      }
      if (layer === "back") {
        // back wall and its inside face, with windows and the lamp
        [WALLS[0], WALLS[1]].forEach(function (w) {
          box(w.x, w.y, w.w, w.h, w.z, roof, wall);
        });
        fill("#efe0b4");
        [[114, 0], [214, 0]].forEach(function (win) {
          ctx.fillRect(win[0], 38 * K - 22, 30, 14);
        });
        fill("#e8c33a");
        ctx.fillRect(108, 38 * K - 6, 50, 2);
        ctx.fillRect(202, 38 * K - 6, 50, 2);
        fill("#fff6c8");
        ctx.fillRect(176, 38 * K - 24, 8, 4);
        drawFlag(240, 30 * K - 26);
        return;
      }
      // side walls are drawn by depth with everything else; the front wall too
      var w = layer;
      box(w.x, w.y, w.w, w.h, w.z, roof, wallFront);
      if (w.w > 8) {
        fill(shade(roof, 18));
        ctx.fillRect(w.x, w.y * K - w.z, w.w, 2);
      }
    }

    function drawDesk() {
      box(DESK.x, DESK.y, DESK.w, DESK.h, 12, "#2a3a72", "#1b2652");
      // monitor
      var glow = game && game.progress > 0 && game.carrying === 0 ? 0.5 + Math.sin(performance.now() / 80) * 0.25 : 0;
      box(166, 84, 28, 4, 26, "#20304f", glow ? "rgba(120,240,255," + (0.85 + glow * 0.15) + ")" : "#3fe0f0", 12);
      fill("rgba(255,255,255,.55)");
      ctx.fillRect(168, 88 * K - 24, 10, 2);
      if (game && game.progress > 0 && game.carrying === 0) {
        var cx = TERMINAL.x;
        var cy = 80 * K - 40;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(16,20,24,.65)";
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#83c626";
        ctx.beginPath();
        ctx.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + (game.progress / HACK_SECONDS) * Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawTree(t) {
      var x = t[0];
      var y = t[1];
      fill("rgba(0,0,0,.14)");
      ctx.beginPath();
      ctx.ellipse(x, y * K + 2, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      box(x - 4, y - 4, 8, 6, 14, "#8a5a33", "#6d4426");
      box(x - 14, y - 12, 28, 18, 38, "#4fbf3c", "#2f8d2a", 14);
      box(x - 9, y - 8, 18, 10, 50, "#62d24c", "#3aa232", 38);
    }

    function drawAvatar(body, kind) {
      drawBlocky(ctx, body.x, body.y * K, LOOKS[kind === "guard" ? "guard" : "tanagorn"], body);
    }

    function drawAlert(g) {
      var since = game.time - g.wokeAt;
      var pop = since < 0.25 ? 0.6 + since * 2.4 : 1 + Math.sin(game.time * 10) * 0.05;
      var x = g.x;
      var y = g.y * K - 44;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pop, pop);
      fill("#dc4043");
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      text("!", 0, 1, 13, "#fff", "#7a1214");
      ctx.restore();
    }

    function drawArrows() {
      var pulse = (game.time * 50) % 34;
      fill("#ffbf26");
      ctx.strokeStyle = "#ae710a";
      ctx.lineWidth = 1.5;
      for (var ay = 186 + pulse; ay < HOME_Y - 6; ay += 34) {
        ctx.beginPath();
        ctx.moveTo(168, ay * K);
        ctx.lineTo(192, ay * K);
        ctx.lineTo(180, ay * K + 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    function draw() {
      if (!game) return;
      var dpr = view.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fill("#5cc23a");
      ctx.fillRect(0, 0, view.width, view.height);
      ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

      drawGround();
      text("HOME", 180, (HOME_Y + 30) * K, 20, "#fff", "#1d6b33");
      drawOffice("floor");
      if (game.carrying > 0) drawArrows();

      // Everything that stands up is drawn back to front.
      var items = [{ y: 38, fn: function () { drawOffice("back"); } }];
      items.push({ y: DESK.y + DESK.h, fn: drawDesk });
      [WALLS[2], WALLS[3]].forEach(function (w) {
        for (var sy = w.y; sy < w.y + w.h; sy += 14) {
          (function (piece) {
            items.push({ y: piece.y + piece.h, fn: function () { drawOffice(piece); } });
          })({ x: w.x, y: sy, w: w.w, h: Math.min(14, w.y + w.h - sy), z: w.z });
        }
      });
      [WALLS[4], WALLS[5]].forEach(function (w) {
        items.push({ y: w.y + w.h, fn: function () { drawOffice(w); } });
      });
      TREES.forEach(function (t) {
        items.push({ y: t[1] + 6, fn: function () { drawTree(t); } });
      });
      items.push({ y: game.guard.y, fn: function () { drawAvatar(game.guard, "guard"); } });
      items.push({ y: game.player.y, fn: function () { drawAvatar(game.player, "player"); } });
      items.sort(function (a, b) {
        return a.y - b.y;
      });
      items.forEach(function (item) {
        item.fn();
      });

      if (!game.guard.awake) text("GUARD", POST.x, POST.y * K - 46, 9, "#fff", "#7a1214");
      else drawAlert(game.guard);

      game.floats.forEach(function (f) {
        var k = f.age / f.life;
        ctx.globalAlpha = 1 - k * k;
        text(f.text, f.x, f.y * K - f.z - k * 26, f.size, f.color, "#101418");
      });
      ctx.globalAlpha = 1;
      game.confetti.forEach(function (c) {
        fill(c.color);
        ctx.fillRect(c.x - 2, c.y * K - c.z - 2, 4, 4);
      });

      if (game.flash > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var g = ctx.createRadialGradient(view.width / 2, view.height / 2, view.height * 0.2, view.width / 2, view.height / 2, view.height * 0.8);
        g.addColorStop(0, "rgba(220,64,67,0)");
        g.addColorStop(1, "rgba(220,64,67," + 0.55 * game.flash + ")");
        fill(g);
        ctx.fillRect(0, 0, view.width, view.height);
      }
    }

    /* Input */
    var keyMap = {
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
    };

    function onScreen() {
      var r = root.getBoundingClientRect();
      var shown = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      return shown > r.height * 0.3;
    }

    function active() {
      return root.dataset.state === "playing" && onScreen() && !isTyping(document.activeElement);
    }

    document.addEventListener("keydown", function (event) {
      if (!active()) return;
      if (keyMap[event.key]) {
        keys[keyMap[event.key]] = true;
        event.preventDefault();
      } else if (event.key === "e" || event.key === "E" || event.key === " ") {
        hacking = true;
        event.preventDefault();
      }
    });
    document.addEventListener("keyup", function (event) {
      if (keyMap[event.key]) keys[keyMap[event.key]] = false;
      if (event.key === "e" || event.key === "E" || event.key === " ") hacking = false;
    });
    window.addEventListener("blur", function () {
      keys = {};
      hacking = false;
      pointerTarget = null;
    });

    function toWorld(event) {
      var r = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - r.left - view.x) / view.scale,
        y: (event.clientY - r.top - view.y) / view.scale / K,
      };
    }
    canvas.addEventListener("pointerdown", function (event) {
      if (root.dataset.state !== "playing") return;
      event.preventDefault();
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        // Moving still works without capture.
      }
      pointerTarget = toWorld(event);
    });
    canvas.addEventListener("pointermove", function (event) {
      if (pointerTarget) pointerTarget = toWorld(event);
    });
    function releasePointer() {
      pointerTarget = null;
    }
    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointercancel", releasePointer);

    hackButton.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      event.preventDefault();
      try {
        hackButton.setPointerCapture(event.pointerId);
      } catch (error) {
        // Holding still works without capture.
      }
      hacking = true;
    });
    function releaseHack() {
      hacking = false;
    }
    hackButton.addEventListener("pointerup", releaseHack);
    hackButton.addEventListener("pointercancel", releaseHack);
    hackButton.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });

    goButton.addEventListener("click", start);

    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(root);
    else window.addEventListener("resize", resize);

    root.hidden = false;
    return { root: root, start: start };
  }

  /* FPGA math alarm: red tint and a notification, no sound */
  function initAlarm() {
    var card = document.querySelector("[data-alarm-card]");
    if (!card) return null;
    var status = card.querySelector("[data-alarm-status]");
    var questionLabel = card.querySelector("[data-alarm-question]");
    var word = card.querySelector("[data-alarm-word]");
    var ringButton = card.querySelector("[data-alarm-ring]");

    var toast = make("div", "alarm-toast");
    toast.setAttribute("role", "dialog");
    toast.setAttribute("aria-label", "Alarm");
    toast.inert = true;
    var head = make("div", "alarm-toast-head");
    var headTitle = make("strong", "", "● Alarm");
    var headTime = make("span");
    head.append(headTitle, headTime);
    var title = make("p", "alarm-toast-title");
    var form = make("form", "alarm-form");
    var label = make("label");
    label.htmlFor = "alarm-answer";
    var input = make("input");
    input.id = "alarm-answer";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your answer");
    var submit = make("button", "", "Silence");
    submit.type = "submit";
    form.append(label, input, submit);
    var hint = make("p", "alarm-hint");
    hint.setAttribute("aria-live", "polite");
    toast.append(head, title, form, hint);
    document.body.appendChild(toast);

    var a = 7;
    var b = 8;
    var state = "idle";
    var closeTimer;

    function newQuestion() {
      a = Math.floor(rand(3, 13));
      b = Math.floor(rand(3, 13));
      label.textContent = a + " × " + b + " =";
      questionLabel.textContent = a + "×" + b;
    }

    function setState(next, statusText, wordText) {
      state = next;
      card.dataset.state = next;
      status.textContent = statusText;
      word.textContent = wordText;
      document.documentElement.classList.toggle("is-alarm", next === "ringing");
    }

    function openToast() {
      toast.inert = false;
      toast.classList.add("is-open");
    }

    function closeToast() {
      toast.classList.remove("is-open");
      toast.inert = true;
    }

    function ring(focusInput) {
      if (state === "ringing") {
        if (focusInput) input.focus({ preventScroll: true });
        return;
      }
      window.clearTimeout(closeTimer);
      newQuestion();
      setState("ringing", "Ringing", "BUZZING");
      toast.classList.remove("is-solved");
      headTitle.textContent = "● Alarm";
      headTime.textContent = bangkokTime() + " BKK · FPGA B";
      title.textContent = "Wake up! Solve this to silence the alarm.";
      hint.textContent = "Two boards. One math problem. No snooze button.";
      form.hidden = false;
      input.value = "";
      ringButton.textContent = "Ringing…";
      openToast();
      if (focusInput) input.focus({ preventScroll: true });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var answer = parseInt(input.value, 10);
      if (answer === a * b) {
        setState("silenced", "Silenced ✓", "OFF");
        toast.classList.add("is-solved");
        headTitle.textContent = "✓ Silenced";
        title.textContent = "Correct. FPGA A sent the signal and FPGA B stopped the alarm.";
        hint.textContent = "That’s the whole project, in miniature.";
        form.hidden = true;
        ringButton.textContent = "Ring it again";
        closeTimer = window.setTimeout(closeToast, 3200);
      } else {
        hint.textContent =
          (isNaN(answer) ? "Type a number." : "Not quite.") +
          " Here’s a new one.";
        newQuestion();
        input.value = "";
        if (!reduceMotion) {
          toast.classList.remove("is-wrong");
          void toast.offsetWidth;
          toast.classList.add("is-wrong");
        }
      }
    });

    ringButton.addEventListener("click", function () {
      ring(true);
    });
    ringButton.hidden = false;

    var alreadyRang = false;
    try {
      alreadyRang = sessionStorage.getItem("tf-alarm-rang") === "1";
    } catch (error) {
      alreadyRang = false;
    }

    if ("IntersectionObserver" in window && !alreadyRang) {
      var timer;
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            window.clearTimeout(timer);
            if (!entry.isIntersecting) return;
            timer = window.setTimeout(function () {
              observer.disconnect();
              try {
                sessionStorage.setItem("tf-alarm-rang", "1");
              } catch (error) {
                // Ringing again next visit is fine.
              }
              if (state === "idle") ring(false);
            }, 700);
          });
        },
        { threshold: 0.6 },
      );
      observer.observe(card);
    }


    setState("idle", "", "STANDBY");
    return { ring: ring, card: card };
  }

  /* tf.OS terminal */
  function initTerminal(alarm, hac) {
    var opener = document.querySelector("[data-terminal-open]");
    var shell = make("div", "tfos");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "tf.OS terminal");
    shell.inert = true;

    var bar = make("div", "tfos-bar");
    var closeButton = make("button", "", "Esc · close");
    closeButton.type = "button";
    bar.append(make("span", "", "tf.OS 1.0 · ~ to toggle"), closeButton);
    var body = make("div", "tfos-body");
    var log = make("div");
    var form = make("form", "tfos-form");
    var prompt = make("label", "", "guest@tanagorn:~$");
    prompt.htmlFor = "tfos-input";
    var input = make("input");
    input.id = "tfos-input";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("autocapitalize", "off");
    form.append(prompt, input);
    body.append(log, form);
    shell.append(bar, body);
    document.body.appendChild(shell);

    var history = [];
    var historyIndex = 0;
    var lastFocus = null;
    var greeted = false;

    var commandNames = [
      "help", "whoami", "ls", "open", "play", "alarm", "roster", "stack",
      "contact", "resume", "theme", "time", "echo", "sudo hire tanagorn",
      "clear", "exit",
    ];

    var projects = {
      "roster-companion": "projects/roster-companion.html",
      roster: "projects/roster-companion.html",
      "hack-a-country": "projects/hack-a-country.html",
      hack: "projects/hack-a-country.html",
      "dual-fpga-math-alarm": "projects/dual-fpga-math-alarm.html",
      fpga: "projects/dual-fpga-math-alarm.html",
      alarm: "projects/dual-fpga-math-alarm.html",
      resume: "resume/",
    };

    function print(text, className) {
      var line = make("p", "tfos-line" + (className ? " " + className : ""), text);
      log.appendChild(line);
      body.scrollTop = body.scrollHeight;
      return line;
    }

    function printLink(before, href, text) {
      var line = print(before);
      var link = make("a", "", text);
      link.href = href;
      line.appendChild(link);
      return line;
    }

    function open() {
      if (shell.classList.contains("is-open")) return;
      document.dispatchEvent(new CustomEvent("tf:terminal", { detail: "open" }));
      lastFocus = document.activeElement;
      shell.inert = false;
      shell.classList.add("is-open");
      if (!greeted) {
        greeted = true;
        print("tf.OS 1.0 · Tanagorn’s portfolio shell", "tfos-ok");
        print("Type help to see what you can do. Esc closes.", "tfos-dim");
      }
      window.setTimeout(function () {
        input.focus({ preventScroll: true });
      }, 50);
    }

    function close() {
      if (shell.classList.contains("is-open"))
        document.dispatchEvent(new CustomEvent("tf:terminal", { detail: "close" }));
      shell.classList.remove("is-open");
      shell.inert = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function goTo(selector, then) {
      close();
      var target = document.querySelector(selector);
      if (!target) return;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      if (then) window.setTimeout(then, reduceMotion ? 0 : 650);
    }

    function run(raw) {
      var line = raw.trim();
      print("$ " + line, "tfos-cmd");
      if (!line) return;
      var lower = line.toLowerCase();
      var parts = lower.split(/\s+/);
      var cmd = parts[0];
      var arg = parts.slice(1).join(" ");

      if (lower === "sudo hire tanagorn") {
        document.dispatchEvent(new CustomEvent("tf:terminal", { detail: "hire" }));
        print("[sudo] password for recruiter: ********", "tfos-dim");
        print("Access granted ✓ Great choice.", "tfos-ok");
        print("Taking you to the contact section…", "tfos-dim");
        window.setTimeout(function () {
          goTo("#contact");
        }, 1100);
        return;
      }

      switch (cmd) {
        case "help":
          print(
            "whoami          who is this guy\n" +
              "ls              list projects\n" +
              "open <project>  open a case study (try: open hack)\n" +
              "play            play mini Hack A Country\n" +
              "alarm           ring the FPGA alarm\n" +
              "roster          try the mini Roster Companion\n" +
              "stack           what I build with\n" +
              "contact         how to reach me\n" +
              "resume          open my résumé\n" +
              "theme           switch light / dark\n" +
              "time            Bangkok time\n" +
              "clear · exit",
          );
          print("Psst: there may be a sudo command worth trying.", "tfos-dim");
          break;
        case "whoami":
          print(
            "Tanagorn Fukuhara\nSoftware engineer @ Novitech AI Solutions\nComputer Engineering @ KMITL, Bangkok\nBackend systems, AI, and games.",
          );
          break;
        case "ls":
        case "dir":
          print("roster-companion/   hack-a-country/   dual-fpga-math-alarm/   resume/");
          break;
        case "cd":
        case "open":
        case "cat":
          if (projects[arg.replace(/\/$/, "")]) {
            print("Opening " + arg + "…", "tfos-dim");
            window.setTimeout(function () {
              window.location.href = projects[arg.replace(/\/$/, "")];
            }, 400);
          } else {
            print(cmd + ": " + (arg || "missing project") + ": try ls", "tfos-dim");
          }
          break;
        case "play":
        case "heist":
          print("Loading Hack A Country (mini)…", "tfos-ok");
          goTo(".featured-project", function () {
            if (hac) hac.start();
          });
          break;
        case "alarm":
          print("Ringing FPGA B… good luck.", "tfos-ok");
          if (alarm)
            goTo("[data-alarm-card]", function () {
              alarm.ring(true);
            });
          break;
        case "roster":
          goTo(".roster-project");
          break;
        case "stack":
          print(
            "languages   JavaScript · TypeScript · SQL · C# · Luau\n" +
              "backend     Node.js · AWS Lambda · PostgreSQL · WebSockets\n" +
              "ai          LLM orchestration · RAG · real-time voice\n" +
              "desktop     .NET 8 · WPF · Win32\n" +
              "games       Roblox Studio\n" +
              "hardware    gate-level FPGA · Arduino · Raspberry Pi",
          );
          break;
        case "contact":
        case "email":
          printLink("", "mailto:tanagornfukuhara@gmail.com", "tanagornfukuhara@gmail.com");
          printLink("", "https://github.com/tanagornf", "github.com/tanagornf");
          printLink("", "https://www.linkedin.com/in/tanagorn-fukuhara/", "linkedin.com/in/tanagorn-fukuhara");
          break;
        case "resume":
          print("Opening résumé…", "tfos-dim");
          window.setTimeout(function () {
            window.location.href = "resume/";
          }, 400);
          break;
        case "theme":
          var toggle = document.querySelector(".theme-toggle");
          if (toggle) toggle.click();
          print("Theme: " + (document.documentElement.dataset.theme || "light"), "tfos-ok");
          break;
        case "time":
        case "date":
          print(bangkokTime() + " in Bangkok (UTC+7)");
          break;
        case "echo":
          print(line.slice(5));
          break;
        case "sudo":
          print("Nice try. This incident will be reported to Tanagorn.", "tfos-dim");
          break;
        case "rm":
          print("Permission denied. This portfolio is load-bearing.", "tfos-dim");
          break;
        case "hello":
        case "hi":
        case "sawasdee":
          print("สวัสดีครับ 👋 Welcome to the shell.");
          break;
        case "clear":
          log.textContent = "";
          break;
        case "exit":
        case "quit":
          close();
          break;
        default:
          print("command not found: " + cmd + ". Type help.", "tfos-dim");
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value;
      if (value.trim()) history.push(value);
      historyIndex = history.length;
      input.value = "";
      run(value);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        if (history[historyIndex] != null) input.value = history[historyIndex];
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
      } else if (event.key === "Tab") {
        var typed = input.value.toLowerCase();
        if (!typed) return;
        event.preventDefault();
        var match = commandNames.filter(function (name) {
          return name.indexOf(typed) === 0;
        });
        if (match.length === 1) input.value = match[0] + " ";
        else if (match.length > 1) print(match.join("   "), "tfos-dim");
      } else if (event.key === "`" || event.key === "~") {
        if (!input.value) {
          event.preventDefault();
          close();
        }
      }
    });

    body.addEventListener("click", function (event) {
      if (event.target.tagName !== "A" && !window.getSelection().toString())
        input.focus({ preventScroll: true });
    });
    closeButton.addEventListener("click", close);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && shell.classList.contains("is-open")) {
        close();
        return;
      }
      if ((event.key === "`" || event.key === "~") && !isTyping(event.target)) {
        event.preventDefault();
        if (shell.classList.contains("is-open")) close();
        else open();
      }
    });

    if (opener) {
      opener.hidden = false;
      opener.addEventListener("click", open);
    }
  }

  /* Mini-me: a tiny Tanagorn who sits on the hero card, then follows you down the page. */
  function initMiniMe() {
    var art = document.querySelector(".systems-art");
    if (!art) return;
    var phone = !window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.innerWidth < 600;
    var S = phone ? 1.7 : 2.4; // drawing scale
    var CW = 44; // canvas size in avatar units
    var CH = 62;

    var buddy = make("button", "minime");
    buddy.type = "button";
    buddy.setAttribute("aria-label", "Mini Tanagorn. Click for a tip.");
    var canvas = make("canvas");
    canvas.setAttribute("aria-hidden", "true");
    buddy.appendChild(canvas);
    var bubble = make("div", "minime-bubble");
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    var bubbleText = make("p");
    var hide = make("button", "minime-hide", "Hide me");
    hide.type = "button";
    bubble.append(bubbleText, hide);
    var recall = make("button", "minime-recall", "◕ mini me");
    recall.type = "button";
    recall.setAttribute("aria-label", "Bring back mini Tanagorn");
    document.body.append(buddy, bubble, recall);
    var ctx = canvas.getContext("2d");

    var lines = {
      top: [
        "Hi! I’m Tanagorn. The mini one.",
        "Go ahead, drag those stickers.",
        "Press ~ for my terminal.",
      ],
      projects: [
        "Every project here has a playable mini version.",
        "The guard wakes at the yellow line. Hack fast!",
        "I built that alarm from logic gates. No Verilog.",
      ],
      experience: [
        "I work on nless.ai at Novitech AI Solutions.",
        "Year 4 Computer Engineering at KMITL.",
      ],
      skills: [
        "Backend, AI, desktop, games, and some hardware.",
        "Yes, Luau counts as a language.",
      ],
      about: [
        "I like knowing how things work. Then fixing them.",
        "That player card? Every stat on it is true.",
      ],
      contact: [
        "Say hi! I reply faster than the guard runs.",
        "Email’s right there. I’ll wait.",
      ],
    };
    var spots = { projects: 0.1, experience: 0.86, skills: 0.14, about: 0.82, contact: 0.5 };
    var lineIndex = {};

    var pos = { x: 0, y: 0 };
    var mode = "perch";
    var hop = null;
    var section = "top";
    var lookUntil = 0;
    var pose = { dir: "down", moving: false, walk: 0, smile: true };
    var react = null; // { kind, until }
    var lastInput = performance.now();
    var asleep = false;
    var typing = false;
    var bubbleUntil = 0;
    var hidden = false;
    var started = performance.now();
    var placed = false;

    try {
      hidden = localStorage.getItem("tf-minime-hidden") === "1";
    } catch (error) {
      hidden = false;
    }

    function size() {
      canvas.width = Math.round(CW * S * Math.min(2, window.devicePixelRatio || 1));
      canvas.height = Math.round(CH * S * Math.min(2, window.devicePixelRatio || 1));
      canvas.style.width = CW * S + "px";
      canvas.style.height = CH * S + "px";
    }

    function currentSection() {
      if (mode === "perch") return "top";
      var probe = window.innerHeight * 0.45;
      var found = "top";
      document.querySelectorAll("main section[id]").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) found = el.id === "top" ? "top" : el.id;
      });
      return lines[found] ? found : "top";
    }

    function say(text, ms) {
      bubbleText.textContent = text;
      bubble.classList.add("is-on");
      bubbleUntil = performance.now() + (ms || 3800);
    }

    function setHidden(value) {
      hidden = value;
      buddy.hidden = value;
      recall.hidden = !value;
      if (value) bubble.classList.remove("is-on");
      try {
        localStorage.setItem("tf-minime-hidden", value ? "1" : "0");
      } catch (error) {
        // Remembering is a convenience only.
      }
    }

    function wake() {
      lastInput = performance.now();
      if (asleep) {
        asleep = false;
        react = { kind: "startle", until: performance.now() + 600 };
      }
    }

    ["scroll", "pointermove", "keydown", "touchstart"].forEach(function (name) {
      window.addEventListener(name, wake, { passive: true });
    });

    buddy.addEventListener("click", function () {
      wake();
      var key = section;
      var list = lines[key];
      lineIndex[key] = ((lineIndex[key] == null ? -1 : lineIndex[key]) + 1) % list.length;
      say(list[lineIndex[key]]);
      react = { kind: "wave", until: performance.now() + 1200 };
    });
    buddy.addEventListener("pointerenter", function () {
      if (!react) react = { kind: "wave", until: performance.now() + 900 };
    });
    hide.addEventListener("click", function () {
      setHidden(true);
      recall.focus({ preventScroll: true });
    });
    recall.addEventListener("click", function () {
      setHidden(false);
      say("I’m back!", 2000);
      buddy.focus({ preventScroll: true });
    });

    document.addEventListener("tf:game", function (event) {
      if (event.detail === "banked") {
        react = { kind: "jump", until: performance.now() + 1600 };
        say("We did it! +35 DATA!", 2600);
      } else {
        react = { kind: "sad", until: performance.now() + 1600 };
        say("Ouch. The guard is quicker than he looks.", 2600);
      }
    });
    document.addEventListener("tf:terminal", function (event) {
      if (event.detail === "open") typing = true;
      else if (event.detail === "close") typing = false;
      else if (event.detail === "hire") {
        typing = false;
        react = { kind: "jump", until: performance.now() + 2000 };
        window.setTimeout(function () {
          say("You typed it. No take-backs!", 3000);
        }, 300);
      }
    });
    document.addEventListener("tf:squish", function (event) {
      if (hidden || !placed) return;
      event.detail.handled = true;
      say(event.detail.face + "  " + event.detail.words, 1500);
      react = { kind: "squish", until: performance.now() + 400 };
    });

    function targetFor() {
      var r = art.getBoundingClientRect();
      var headerBottom = 80;
      var perchVisible = r.bottom > headerBottom + 100 && r.top < window.innerHeight - 40;
      if (perchVisible) {
        mode = "perch";
        // Sit on the card's top edge, following its tilt.
        var m = new DOMMatrixReadOnly(getComputedStyle(art).transform === "none" ? undefined : getComputedStyle(art).transform);
        var angle = Math.atan2(m.b, m.a);
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var u = art.offsetWidth * 0.22;
        var h0 = art.offsetHeight / 2;
        return {
          x: cx + u * Math.cos(angle) + h0 * Math.sin(angle),
          y: cy + u * Math.sin(angle) - h0 * Math.cos(angle) + 5 * S,
          mode: "perch",
        };
      }
      mode = "walk";
      var spot = spots[section] != null ? spots[section] : 0.12;
      var margin = 40;
      return {
        x: clamp(window.innerWidth * spot, margin, window.innerWidth - margin),
        y: window.innerHeight - (phone ? 10 : 14),
        mode: "walk",
      };
    }

    var lastFrame = performance.now();
    var lastMode = null;

    function frame(now) {
      if (hidden) {
        lastFrame = now;
        window.requestAnimationFrame(frame);
        return;
      }
      var dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      var nextSection = currentSection();
      if (nextSection !== section) {
        section = nextSection;
        lookUntil = 0;
      }
      var target = targetFor();

      if (!placed) {
        pos.x = target.x;
        pos.y = target.y;
        placed = true;
        lastMode = target.mode;
        react = { kind: "wave", until: now + 2200 };
      }

      if (target.mode !== lastMode && !reduceMotion) {
        hop = { fromX: pos.x, fromY: pos.y, start: now, duration: 600 };
        lastMode = target.mode;
      } else if (target.mode !== lastMode) lastMode = target.mode;

      pose.moving = false;
      var lift = 0;
      if (hop) {
        var k = Math.min(1, (now - hop.start) / hop.duration);
        pos.x = hop.fromX + (target.x - hop.fromX) * k;
        pos.y = hop.fromY + (target.y - hop.fromY) * k;
        lift = Math.sin(k * Math.PI) * 70;
        pose.dir = target.x < hop.fromX ? "left" : "right";
        if (k >= 1) hop = null;
      } else if (target.mode === "perch") {
        pos.x = target.x;
        pos.y = target.y;
      } else {
        pos.y = target.y;
        var dx = target.x - pos.x;
        if (Math.abs(dx) > 2 && !typing && !asleep) {
          var stepLength = reduceMotion ? Math.abs(dx) : Math.min(Math.abs(dx), 150 * dt);
          pos.x += Math.sign(dx) * stepLength;
          pose.moving = !reduceMotion;
          pose.dir = dx > 0 ? "right" : "left";
          pose.walk += dt;
          lookUntil = 0;
        } else if (!lookUntil) {
          lookUntil = now + 1400;
          pose.dir = "up";
        } else if (now > lookUntil) {
          pose.dir = "down";
        }
      }

      if (!typing && !hop && now - lastInput > 25000 && !document.documentElement.classList.contains("is-alarm")) asleep = true;
      if (react && now > react.until) react = null;

      var alarm = document.documentElement.classList.contains("is-alarm");
      var sitting = target.mode === "perch" || typing || asleep;
      var drawPose = {
        dir: hop ? pose.dir : sitting ? "down" : pose.dir,
        moving: pose.moving,
        walk: pose.walk,
        smile: true,
        sitting: sitting && !hop,
        noShadow: target.mode === "perch",
      };
      var jump = 0;
      if (alarm) {
        drawPose.ears = true;
        drawPose.dir = "down";
        drawPose.smile = false;
        jump = reduceMotion ? 0 : Math.abs(Math.sin(now / 90)) * 4;
      } else if (react && react.kind === "wave") {
        drawPose.wave = now / 1000;
        drawPose.dir = "down";
      } else if (react && react.kind === "jump") {
        drawPose.wave = now / 1000;
        drawPose.dir = "down";
        jump = reduceMotion ? 0 : Math.abs(Math.sin(now / 130)) * 14;
      } else if (react && react.kind === "sad") {
        drawPose.smile = false;
        drawPose.dir = "down";
      } else if (react && react.kind === "startle") {
        drawPose.dir = "down";
        jump = 6;
      }
      if (asleep) drawPose.eyesClosed = true;

      // Draw
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
      var squash = react && react.kind === "squish" ? 0.8 : 1;
      ctx.translate(CW / 2, CH - 4 - jump / S);
      ctx.scale(squash < 1 ? 1.15 : 1, squash);
      drawBlocky(ctx, 0, 0, LOOKS.tanagorn, drawPose);
      if (typing && !hop) {
        // a tiny laptop on the lap
        ctx.fillStyle = "#2a3a72";
        ctx.fillRect(-8, -12, 16, 2);
        ctx.fillStyle = "#3fe0f0";
        ctx.fillRect(-7, -21, 14, 9);
        ctx.fillStyle = "rgba(255,255,255,.6)";
        ctx.fillRect(-5, -19 + ((now / 120) | 0) % 6, 6, 1);
      }
      if (asleep) {
        ctx.font = "800 7px Manrope, sans-serif";
        ctx.fillStyle = "#5e6158";
        var zz = (now / 600) % 1;
        ctx.globalAlpha = 1 - zz;
        ctx.fillText("z", 7 + zz * 4, -36 - zz * 8);
        ctx.globalAlpha = 1;
        ctx.fillText("Z", 11, -44);
      }

      var w = CW * S;
      var h = CH * S;
      buddy.style.transform = "translate(" + Math.round(pos.x - w / 2) + "px," + Math.round(pos.y - h - lift) + "px)";

      if (bubble.classList.contains("is-on")) {
        if (bubble.matches(":hover") || bubble.contains(document.activeElement)) bubbleUntil = now + 1500;
        if (now > bubbleUntil) bubble.classList.remove("is-on");
        var bw = bubble.offsetWidth;
        var bx = clamp(pos.x - bw / 2, 8, window.innerWidth - bw - 8);
        var by = pos.y - h - lift - bubble.offsetHeight + 6 * S;
        if (by < 70) by = pos.y + 8;
        bubble.style.transform = "translate(" + Math.round(bx) + "px," + Math.round(by) + "px)";
      }
      window.requestAnimationFrame(frame);
    }

    size();
    setHidden(hidden);
    window.requestAnimationFrame(frame);
  }

  /* The About section's player card: the same avatar, blinking, waving when you hover the card. */
  function initPlayerCard() {
    var canvas = document.querySelector("[data-player-avatar]");
    if (!canvas) return;
    var card = canvas.closest(".player-card");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = 84 * dpr;
    canvas.height = 104 * dpr;
    var waving = 0;
    var running = false;
    var nextBlink = performance.now() + 2500;

    function draw(now) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * 2.4, 0, 0, dpr * 2.4, 0, 0);
      var blink = now > nextBlink && now < nextBlink + 140;
      if (now > nextBlink + 140) nextBlink = now + 2500 + Math.random() * 2500;
      drawBlocky(ctx, 17.5, 38 - (reduceMotion ? 0 : Math.sin(now / 500) * 0.4), LOOKS.tanagorn, {
        dir: "down",
        smile: true,
        eyesClosed: blink,
        wave: now < waving ? now / 1000 : null,
      });
    }

    function loop(now) {
      draw(now);
      if (running && !reduceMotion) window.requestAnimationFrame(loop);
    }

    function wave() {
      waving = performance.now() + 1400;
      if (reduceMotion) draw(performance.now());
    }
    card.addEventListener("pointerenter", wave);
    card.addEventListener("click", wave);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) {
          running = true;
          window.requestAnimationFrame(loop);
        } else if (!visible) running = false;
      }).observe(canvas);
    }
    draw(performance.now());
  }

  function init() {
    var hero = initStickers();
    initSquish(hero);
    initRoster();
    var hac = initHackACountry();
    var alarm = initAlarm();
    initTerminal(alarm, hac);
    initMiniMe();
    initPlayerCard();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
