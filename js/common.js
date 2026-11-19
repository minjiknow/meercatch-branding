jQuery(function ($) {
    // 함수 초기화 목록
    initHeaderScrollBackground();
    initDrawer();

    // Start: 드로어 열기·닫기
    function initDrawer() {
        $(".drawer").each(function () {
            const drawer = this;
            const $drawer = $(drawer);
            const $triggers = $(".btn-hamburger").filter(function () {
                return this.getAttribute("aria-controls") === drawer.id;
            });
            let opener = null;
            let background = [];
            const focusable = () => $drawer.find('a[href], button, input, select, textarea, [tabindex]')
                .filter(':visible').filter(function () { return !this.disabled && this.tabIndex >= 0; });

            function closeDrawer() {
                $drawer.hide();
                background.forEach(([element, wasInert]) => { element.inert = wasInert; });
                background = [];
                $triggers.attr("aria-expanded", "false");
                opener?.focus({ preventScroll: true });
                opener = null;
            }

            $triggers.on("click.drawer", function (event) {
                event.preventDefault();
                if ($drawer.is(":visible")) return;
                opener = this;
                $drawer.show();
                $triggers.attr("aria-expanded", "true");
                // 배경의 원래 inert 상태를 보존하고 닫을 때 복구합니다.
                let branch = drawer;
                while (branch.parentElement && branch !== document.body) {
                    Array.from(branch.parentElement.children).forEach((element) => {
                        if (element !== branch && element instanceof HTMLElement) {
                            background.push([element, element.inert]);
                            element.inert = true;
                        }
                    });
                    branch = branch.parentElement;
                }
                (focusable().get(0) || drawer).focus({ preventScroll: true });
            });

            $drawer.find(".btn-close, .btn.close").on("click.drawer", function (event) {
                event.preventDefault();
                closeDrawer();
            });
            $drawer.on("keydown.drawer", function (event) {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeDrawer();
                } else if (event.key === "Tab") {
                    const $items = focusable();
                    const first = $items.get(0);
                    const last = $items.get(-1);
                    if (!first) {
                        event.preventDefault();
                        drawer.focus();
                    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === drawer)) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === drawer)) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            });
        });
    }
    // End: 드로어 열기·닫기

    // Start: 스크롤 시 헤더 배경과 블러
    function initHeaderScrollBackground() {
        const $header = $(".header").first();
        if (!$header.length) return;

        const fadeDistance = 300; // 배경이 최대 불투명도에 도달하는 스크롤 거리(px)
        const maxOpacity = 0.75; // 이후 모든 섹션에서도 배경 불투명도를 최대 50%로 유지
        const maxBlur = 20; // 최대 배경 블러 반경(px)
        let frameId = null;
        let previousOpacity = null;

        function updateBackground() {
            const progress = Math.min(1, Math.max(0, window.scrollY / fadeDistance));
            const opacity = progress * maxOpacity;

            if (opacity !== previousOpacity) {
                $header.css("--header-bg-opacity", opacity);
                $header.css("--header-blur", `${progress * maxBlur}px`);
                previousOpacity = opacity;
            }

            frameId = null;
        }

        function scheduleUpdate() {
            if (frameId !== null) return;
            frameId = requestAnimationFrame(updateBackground);
        }

        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        window.addEventListener("pageshow", scheduleUpdate);
        if (window.ScrollTrigger) {
            // 스크롤 애니메이션의 레이아웃 재계산 후에도 배경을 맞춥니다.
            window.ScrollTrigger.addEventListener("refresh", scheduleUpdate);
        }
        updateBackground();
    }
    // End: 스크롤 시 헤더 배경과 블러
});
