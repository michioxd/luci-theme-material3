"use strict";

(function () {
    const ROTATE_DURATION = 1568;
    const FILL_DURATION = 5332;
    const SPIN_DURATION = 1333;

    function animationDelay(duration) {
        return `-${performance.now() % duration}ms`;
    }

    function syncAnimationPhase(spinner) {
        const container = spinner;
        const fill = spinner.querySelector(":scope > .spinner");
        const circles = spinner.querySelectorAll(":scope > .spinner > .circle");

        container.style.animationDelay = animationDelay(ROTATE_DURATION);
        if (fill) fill.style.animationDelay = animationDelay(FILL_DURATION);

        circles.forEach(function (circle) {
            circle.style.setProperty("--material-spinner-spin-delay", animationDelay(SPIN_DURATION));
        });
    }

    function ensureSpinner(element) {
        if (!element || element.querySelector(":scope > .md-spinner")) return;

        const spinner = E("span", { class: "md-spinner", "aria-hidden": "true" }, [
            E("span", { class: "spinner" }, [
                E("span", { class: "circle left" }),
                E("span", { class: "circle right" }),
            ]),
        ]);

        syncAnimationPhase(spinner);
        element.insertBefore(spinner, element.firstChild);
    }

    function scan(root) {
        if (root.nodeType !== 1) return;

        if (root.classList.contains("spinning")) ensureSpinner(root);
        root.querySelectorAll(".spinning").forEach(ensureSpinner);
    }

    document.addEventListener("DOMContentLoaded", function () {
        scan(document.body);

        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === "attributes") {
                    if (mutation.target.classList.contains("spinning")) ensureSpinner(mutation.target);
                    return;
                }

                mutation.addedNodes.forEach(scan);
            });
        }).observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
            childList: true,
            subtree: true,
        });
    });
})();
