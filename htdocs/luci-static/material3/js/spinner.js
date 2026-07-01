"use strict";

(function () {
    const ROTATE_DURATION = 1568;
    const FILL_DURATION = 5332;
    const SPIN_DURATION = 1333;
    let observer;

    function animationDelay(duration) {
        return `-${performance.now() % duration}ms`;
    }

    function syncAnimationPhase(spinner) {
        const container = spinner;
        const fill = spinner.firstElementChild;
        const circles = fill ? fill.children : [];

        container.style.animationDelay = animationDelay(ROTATE_DURATION);
        if (fill) fill.style.animationDelay = animationDelay(FILL_DURATION);

        Array.prototype.forEach.call(circles, function (circle) {
            circle.style.setProperty("--material-spinner-spin-delay", animationDelay(SPIN_DURATION));
        });
    }

    function ensureSpinner(element) {
        if (!element || element.nodeType !== 1) return;
        if (/^(tr|thead|tbody|tfoot)$/i.test(element.tagName)) return;

        for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
            if (child.classList.contains("md-spinner")) return;
        }

        const spinner = E("span", { class: "md-spinner", "aria-hidden": "true" }, [
            E("span", { class: "spinner" }, [
                E("span", { class: "circle left" }),
                E("span", { class: "circle right" }),
            ]),
        ]);

        syncAnimationPhase(spinner);
        element.insertBefore(spinner, element.firstChild);
    }

    function start() {
        if (!document.body || observer) return;

        scan(document.body);

        observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === "attributes") {
                    if (mutation.target.classList.contains("spinning")) ensureSpinner(mutation.target);
                    return;
                }

                mutation.addedNodes.forEach(scan);
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
            childList: true,
            subtree: true,
        });
    }

    function scan(root) {
        if (root.nodeType !== 1) return;

        if (root.classList.contains("spinning")) ensureSpinner(root);
        root.querySelectorAll(".spinning").forEach(ensureSpinner);
    }

    if (document.readyState === "loading") {
        if (document.body) start();
        else document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
