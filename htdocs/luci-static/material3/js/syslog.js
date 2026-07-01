"use strict";

(function () {
    const SELECTOR = [
        "textarea#syslog",
        "textarea#dmesg",
        'textarea[id*="syslog"]',
        'textarea[id*="dmesg"]',
        'textarea[readonly][wrap="off"]',
        'textarea[readonly][wrap="hard"]',
    ].join(",");
    const PROCESSED = "material3SyslogEnhanced";
    const POLL_DELAY = 2000;
    const icons = {
        wrap: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M21,5H3V7H21V5M3,19H10V17H3V19M3,13H18C19,13 20,13.43 20,15C20,16.57 19,17 18,17H16V15L12,18L16,21V19H18C20.95,19 22,17.73 22,15C22,12.28 21,11 18,11H3V13Z' /></svg>",
        time: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 20C16.4 20 20 16.4 20 12S16.4 4 12 4 4 7.6 4 12 7.6 20 12 20M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2M12.5 12.8L7.7 15.6L7 14.2L11 11.9V7H12.5V12.8Z' /></svg>",
        copy: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z' /></svg>",
        download:
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M14,2H6C4.89,2 4,2.89 4,4V20C4,21.11 4.89,22 6,22H18C19.11,22 20,21.11 20,20V8L14,2M12,19L8,15H10.5V12H13.5V15H16L12,19M13,9V3.5L18.5,9H13Z' /></svg>",
        up: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z' /></svg>",
        down: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z' /></svg>",
        fullscreen:
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z' /></svg>",
    };

    const severityRank = {
        critical: 0,
        error: 1,
        warning: 2,
        denied: 3,
        disconnected: 4,
        notice: 5,
        success: 6,
        info: 7,
        debug: 8,
    };

    const levelMap = {
        emerg: "critical",
        alert: "critical",
        crit: "critical",
        error: "error",
        err: "error",
        warn: "warning",
        warning: "warning",
        notice: "notice",
        info: "info",
        debug: "debug",
    };

    const keywordMap = {
        panic: "critical",
        fatal: "critical",
        failed: "error",
        failure: "error",
        error: "error",
        denied: "denied",
        reject: "denied",
        blocked: "denied",
        warning: "warning",
        warn: "warning",
        disconnected: "disconnected",
        timeout: "disconnected",
        down: "disconnected",
        connected: "success",
        accepted: "success",
        success: "success",
        started: "success",
        notice: "notice",
        debug: "debug",
    };

    function tr(text) {
        return window.L && L.tr ? L.tr(text) : text;
    }

    function isLogPage() {
        const page = document.body ? document.body.getAttribute("data-page") || "" : "";
        return (
            /(^|-)logs($|-)|syslog|dmesg|acme.*logread/.test(page) ||
            /\/status\/logs|\/services\/acme\/logread/.test(location.pathname)
        );
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, function (match) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[match];
        });
    }

    function stripAnsi(value) {
        return String(value || "").replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "");
    }

    function normalizeSeverity(severity) {
        return severity && severityRank[severity] !== undefined ? severity : "info";
    }

    function stronger(current, next) {
        next = normalizeSeverity(next);
        if (!current) return next;
        return severityRank[next] < severityRank[current] ? next : current;
    }

    function classifyWord(word) {
        return keywordMap[String(word || "").toLowerCase()] || null;
    }

    function classifyPrefix(prefix) {
        const bits = String(prefix || "")
            .toLowerCase()
            .split(".");
        return levelMap[bits[bits.length - 1]] || null;
    }

    function renderHighlightedLine(line) {
        const cleanLine = stripAnsi(line);
        const timestampMatch = cleanLine.match(
            /^(?:\[[^\]]*\b\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?(?:\s+[A-Z]{2,5})?\]\s*|\[[\s\d.]+\]\s*|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w+\s+\d+\s+\d{2}:\d{2}:\d{2}\s*|\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s*)/i,
        );
        const timestamp = timestampMatch ? timestampMatch[0] : "";
        const body = timestamp ? cleanLine.slice(timestamp.length) : cleanLine;
        let severity = null;
        const tokenRegex =
            /\b((?:daemon|kern|user|auth|authpriv|cron|mail|news|syslog|local\d)\.(?:emerg|alert|crit|err|error|warn|warning|notice|info|debug))\b|\b([\w.-]+\[\d+\]:)|\b((?:[0-9a-f]{2}:){5}[0-9a-f]{2})\b|\b((?:\d{1,3}\.){3}\d{1,3}(?::\d+)?)\b|\b(panic|fatal|failed|failure|error|denied|reject|blocked|warning|warn|disconnected|timeout|down|connected|accepted|success|started|notice|debug)\b/gi;
        let html = "";
        let lastIndex = 0;
        let match;

        while ((match = tokenRegex.exec(body)) !== null) {
            if (match.index > lastIndex) html += escapeHtml(body.slice(lastIndex, match.index));

            if (match[1]) {
                const prefixSeverity = classifyPrefix(match[1]);
                severity = stronger(severity, prefixSeverity);
                html +=
                    '<span class="md-log-prefix md-log-prefix-' +
                    prefixSeverity +
                    '">' +
                    escapeHtml(match[1]) +
                    "</span>";
            } else if (match[2]) {
                html += '<span class="md-log-process">' + escapeHtml(match[2]) + "</span>";
            } else if (match[3]) {
                html += '<span class="md-log-mac">' + escapeHtml(match[3]) + "</span>";
            } else if (match[4]) {
                html += '<span class="md-log-ip">' + escapeHtml(match[4]) + "</span>";
            } else if (match[5]) {
                const keywordSeverity = classifyWord(match[5]);
                severity = stronger(severity, keywordSeverity);
                html +=
                    '<span class="md-log-keyword md-log-keyword-' +
                    keywordSeverity +
                    '">' +
                    escapeHtml(match[5]) +
                    "</span>";
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < body.length) html += escapeHtml(body.slice(lastIndex));

        return {
            html: (timestamp ? '<span class="md-log-timestamp">' + escapeHtml(timestamp) + "</span>" : "") + html,
            severity: normalizeSeverity(severity),
        };
    }

    function parseLog(text) {
        const rawLines = stripAnsi(text).split("\n");
        const stats = {
            total: 0,
            critical: 0,
            error: 0,
            warning: 0,
            denied: 0,
            disconnected: 0,
            notice: 0,
            success: 0,
            info: 0,
            debug: 0,
        };
        const lines = [];

        rawLines.forEach(function (line) {
            if (!line.trim()) return;
            const parsed = renderHighlightedLine(line);
            stats.total++;
            stats[parsed.severity]++;
            lines.push(parsed);
        });

        return { lines: lines, stats: stats };
    }

    function renderLines(lines) {
        const gutterWidth = Math.max(String(lines.length).length, 3);
        return (
            lines
                .map(function (line, index) {
                    const number = String(index + 1).padStart(gutterWidth, " ");
                    return (
                        '<div class="md-log-line" data-severity="' +
                        line.severity +
                        '"><span class="md-log-gutter" aria-hidden="true">' +
                        number +
                        '</span><span class="md-log-content">' +
                        line.html +
                        "</span></div>"
                    );
                })
                .join("") || '<div class="md-log-empty">' + tr("No log entries") + "</div>"
        );
    }

    function makeButton(icon, title) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "md-log-button ripple-js";
        button.innerHTML = icon;
        button.dataset.icon = icon;
        button.title = title;
        button.setAttribute("aria-label", title);
        return button;
    }

    function buildStats(stats) {
        const labels = [
            ["critical", "crit"],
            ["error", "err"],
            ["warning", "warn"],
            ["denied", "denied"],
            ["disconnected", "disc"],
            ["success", "ok"],
            ["notice", "notice"],
            ["debug", "debug"],
        ];
        let html = '<span class="md-log-total">' + stats.total + " " + tr("lines") + "</span>";

        labels.forEach(function (item) {
            if (!stats[item[0]]) return;
            html +=
                '<button type="button" class="md-log-stat md-log-stat-' +
                item[0] +
                ' ripple-js" data-filter="' +
                item[0] +
                '">' +
                stats[item[0]] +
                " " +
                tr(item[1]) +
                "</button>";
        });

        return html;
    }

    function copyText(text, button) {
        function done() {
            flashButton(button, "✓");
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {});
            return;
        }

        const helper = document.createElement("textarea");
        helper.value = text;
        helper.style.position = "fixed";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
        done();
    }

    function downloadText(textarea, button) {
        const blob = new Blob([textarea.value || ""], { type: "text/plain;charset=utf-8" });
        const anchor = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const name = textarea.id && textarea.id.indexOf("dmesg") !== -1 ? "dmesg.log" : "syslog.log";
        anchor.href = url;
        anchor.download = name;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        flashButton(button, "✓");
    }

    function flashButton(button, label) {
        const original = button.dataset.icon || button.innerHTML || button.textContent;
        button.textContent = label;
        button.classList.add("md-log-button-ok");
        window.setTimeout(function () {
            if (button.dataset.icon) button.innerHTML = original;
            else button.textContent = original;
            button.classList.remove("md-log-button-ok");
        }, 1000);
    }

    function moveNativeFilters(textarea, wrapper) {
        const parent = textarea.parentNode;
        const container = document.createElement("div");
        let node = textarea.previousElementSibling;
        const rows = [];

        while (node && node.tagName === "DIV") {
            if (node.querySelector("select,input,button")) rows.unshift(node);
            node = node.previousElementSibling;
        }

        if (!rows.length) return;
        container.className = "md-log-filters";
        rows.forEach(function (row) {
            row.removeAttribute("style");
            row.classList.add("md-log-filter-row");
            container.appendChild(row);
        });
        parent.insertBefore(container, wrapper);
    }

    function enhanceTextarea(textarea) {
        if (!textarea || textarea.dataset[PROCESSED] === "done") return;

        const data = parseLog(textarea.value || "");
        const wrapper = document.createElement("div");
        const toolbar = document.createElement("div");
        const stats = document.createElement("div");
        const actions = document.createElement("div");
        const viewer = document.createElement("div");
        const wrapBtn = makeButton(icons.wrap, tr("Word wrap"));
        const timeBtn = makeButton(icons.time, tr("Toggle timestamps"));
        const copyBtn = makeButton(icons.copy, tr("Copy log"));
        const downloadBtn = makeButton(icons.download, tr("Download log"));
        const topBtn = makeButton(icons.up, tr("Scroll to top"));
        const bottomBtn = makeButton(icons.down, tr("Scroll to bottom"));
        const fullscreenBtn = makeButton(icons.fullscreen, tr("Fullscreen"));
        let lastValue = textarea.value || "";
        let fullscreen = false;

        wrapper.className = "md-log-wrapper";
        toolbar.className = "md-log-toolbar";
        stats.className = "md-log-stats";
        actions.className = "md-log-actions";
        viewer.className = "md-log-viewer";
        viewer.tabIndex = 0;
        viewer.setAttribute("role", "log");
        viewer.setAttribute("aria-label", "System log viewer");

        stats.innerHTML = buildStats(data.stats);
        viewer.innerHTML = renderLines(data.lines);
        actions.append(wrapBtn, timeBtn, copyBtn, downloadBtn, topBtn, bottomBtn, fullscreenBtn);
        toolbar.append(stats, actions);
        wrapper.append(toolbar, viewer);

        textarea.dataset[PROCESSED] = "done";
        textarea.style.display = "none";
        textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
        moveNativeFilters(textarea, wrapper);

        function refresh(forceBottom) {
            const value = textarea.value || "";
            const nearBottom = viewer.scrollHeight - viewer.scrollTop - viewer.clientHeight < 48;
            const next = parseLog(value);
            stats.innerHTML = buildStats(next.stats);
            viewer.innerHTML = renderLines(next.lines);
            lastValue = value;
            if (forceBottom || nearBottom) viewer.scrollTop = viewer.scrollHeight;
        }

        stats.addEventListener("click", function (event) {
            const target = event.target.closest("[data-filter]");
            if (!target) return;
            const filter = target.getAttribute("data-filter");
            const active = viewer.getAttribute("data-active-filter") === filter;
            viewer.toggleAttribute("data-active-filter", !active);
            if (!active) viewer.setAttribute("data-active-filter", filter);
            stats.querySelectorAll(".md-log-stat").forEach(function (button) {
                button.classList.toggle("active", !active && button === target);
            });
        });

        wrapBtn.addEventListener("click", function () {
            viewer.classList.toggle("md-log-wrapped");
            wrapBtn.classList.toggle("active");
        });
        timeBtn.addEventListener("click", function () {
            const hidden = !viewer.classList.contains("md-log-hide-timestamps");
            viewer.classList.toggle("md-log-hide-timestamps", hidden);
            viewer.dataset.hideTimestamps = hidden ? "true" : "false";
            timeBtn.classList.toggle("active", hidden);
            timeBtn.setAttribute("aria-pressed", hidden ? "true" : "false");
        });
        copyBtn.addEventListener("click", function () {
            copyText(textarea.value || "", copyBtn);
        });
        downloadBtn.addEventListener("click", function () {
            downloadText(textarea, downloadBtn);
        });
        topBtn.addEventListener("click", function () {
            viewer.scrollTo({ top: 0, behavior: "smooth" });
        });
        bottomBtn.addEventListener("click", function () {
            viewer.scrollTo({ top: viewer.scrollHeight, behavior: "smooth" });
        });
        fullscreenBtn.addEventListener("click", function () {
            fullscreen = !fullscreen;
            wrapper.classList.toggle("md-log-fullscreen", fullscreen);
            document.body.classList.toggle("md-log-fullscreen-active", fullscreen);
            fullscreenBtn.innerHTML = fullscreen ? "×" : icons.fullscreen;
            fullscreenBtn.classList.toggle("active", fullscreen);
        });

        const keyHandler = function (event) {
            const tag = event.target && event.target.tagName;
            if (!document.body.contains(wrapper)) {
                document.removeEventListener("keydown", keyHandler);
                return;
            }
            if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "c" &&
                !String(window.getSelection()).length
            ) {
                event.preventDefault();
                copyBtn.click();
            } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                downloadBtn.click();
            } else if (event.key === "Home") {
                event.preventDefault();
                topBtn.click();
            } else if (event.key === "End") {
                event.preventDefault();
                bottomBtn.click();
            } else if (event.key === "F11") {
                event.preventDefault();
                fullscreenBtn.click();
            } else if (event.key === "Escape" && fullscreen) {
                fullscreenBtn.click();
            }
        };
        document.addEventListener("keydown", keyHandler);

        const interval = window.setInterval(function () {
            if (!document.body.contains(textarea)) {
                window.clearInterval(interval);
                return;
            }
            if ((textarea.value || "") !== lastValue) refresh(false);
        }, POLL_DELAY);
    }

    function init() {
        if (!document.body || !isLogPage()) return;
        document.querySelectorAll(SELECTOR).forEach(enhanceTextarea);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

    window.addEventListener("load", init);

    const observer = new MutationObserver(function (mutations) {
        if (!isLogPage()) return;
        if (
            mutations.some(function (mutation) {
                return mutation.target && !mutation.target.closest?.(".md-log-wrapper");
            })
        ) {
            window.clearTimeout(observer.timer);
            observer.timer = window.setTimeout(init, 80);
        }
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-page"],
        });
    }
})();
