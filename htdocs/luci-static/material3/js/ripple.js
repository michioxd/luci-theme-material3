(function () {
    "use strict";

    var rippleTypeAttr = "data-ripple-event";
    var rippleSelector = "ripple-js rippleJS btn cbi-button";
    var cleanupDelay = 650;
    var isInitialized = false;

    function hasClass(element, className) {
        return (" " + element.className + " ").indexOf(" " + className + " ") > -1;
    }

    function addClass(element, className) {
        if (!hasClass(element, className)) {
            element.className = element.className ? element.className + " " + className : className;
        }
    }

    function removeClass(element, className) {
        element.className = (" " + element.className + " ")
            .replace(" " + className + " ", " ")
            .replace(/^\s+|\s+$/g, "");
    }

    function isRippleHolder(element) {
        return (
            hasClass(element, "ripple-js") ||
            hasClass(element, "rippleJS") ||
            hasClass(element, "btn") ||
            hasClass(element, "cbi-button")
        );
    }

    function findRippleHolder(target) {
        while (target && target !== document) {
            if (target.nodeType === 1 && isRippleHolder(target)) {
                return target;
            }

            target = target.parentNode;
        }

        return null;
    }

    function isDisabled(element) {
        return element.disabled || element.getAttribute("disabled") !== null || hasClass(element, "disabled");
    }

    function getRippleOption(holder, name) {
        return holder.getAttribute("data-ripple-" + name) || holder.getAttribute("ripple-" + name) || "";
    }

    function startRipple(type, point) {
        var holder = findRippleHolder(point.target);
        var previousType;
        var rect;
        var x;
        var y;
        var max;
        var dim;
        var ripple;
        var opacity;
        var background;
        var releaseEvent;

        if (!holder || isDisabled(holder)) {
            return false;
        }

        previousType = holder.getAttribute(rippleTypeAttr);
        if (previousType && previousType !== type) {
            return false;
        }

        holder.setAttribute(rippleTypeAttr, type);
        addClass(holder, "active");

        rect = holder.getBoundingClientRect();
        x = point.clientX - rect.left;
        y = point.clientY - rect.top;
        max =
            rect.width === rect.height
                ? rect.width * 1.412
                : Math.sqrt(rect.width * rect.width + rect.height * rect.height);
        dim = max * 2 + "px";

        ripple = document.createElement("div");
        ripple.className = "ripple";
        ripple.style.width = dim;
        ripple.style.height = dim;
        ripple.style.marginLeft = -max + x + "px";
        ripple.style.marginTop = -max + y + "px";

        opacity = getRippleOption(holder, "opacity");
        background = getRippleOption(holder, "background");

        if (opacity) {
            ripple.style.opacity = opacity;
        }
        if (background) {
            ripple.style.backgroundColor = background;
        }

        holder.appendChild(ripple);
        window.setTimeout(function () {
            addClass(ripple, "held");
        }, 0);

        releaseEvent = type === "mousedown" ? "mouseup" : "touchend";

        function release() {
            document.removeEventListener(releaseEvent, release, false);
            addClass(ripple, "done");

            window.setTimeout(function () {
                if (ripple.parentNode === holder) {
                    holder.removeChild(ripple);
                }

                if (!holder.getElementsByClassName || holder.getElementsByClassName("ripple").length === 0) {
                    removeClass(holder, "active");
                    holder.removeAttribute(rippleTypeAttr);
                }
            }, cleanupDelay);
        }

        document.addEventListener(releaseEvent, release, false);
        return true;
    }

    function handleMouseDown(event) {
        event = event || window.event;

        if (!event || event.button !== 0) {
            return;
        }

        startRipple("mousedown", event);
    }

    function handleTouchStart(event) {
        var touches;
        var i;

        event = event || window.event;
        touches = event.changedTouches || [];

        for (i = 0; i < touches.length; i++) {
            startRipple("touchstart", touches[i]);
        }
    }

    function initRipple() {
        if (isInitialized) {
            return;
        }

        isInitialized = true;
        document.addEventListener("mousedown", handleMouseDown, false);
        document.addEventListener("touchstart", handleTouchStart, false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initRipple, false);
    } else {
        initRipple();
    }

    window.Material3Ripple = {
        init: initRipple,
        start: startRipple,
        selector: rippleSelector,
    };
})();
