jQuery(function ($) {
    const $window = $(window);
    const $page = $("html");

    // 함수 초기화 목록
    initNewsCardsAnimation();
    initHeroAnimation();
    initNewsCardsHover();
    initScrollTitleAnimation();
    initSolutionAnimation();
    initQuickNav();
    initValueSlider();

    // 기존 contents-wrap / cards / card 구조를 그대로 사용하는 모바일 배너입니다.
    function initValueSlider() {
        const container = document.querySelector(".mobile-silde .contents-wrap");
        if (!container) return;
        const buttons = container.querySelector(".buttons");
        const cards = container.querySelector(".cards");
        const mobile = window.matchMedia("(max-width: 768px)");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const slides = Array.from(container.querySelectorAll(".card"));
        const captions = slides.map((slide) => slide.querySelector(".title-wrap"));
        const controls = Array.from(container.querySelectorAll(".btn.previous, .btn.next, .btn.autoplay"));
        const playbackButton = container.querySelector(".btn.autoplay");
        let userPaused = reducedMotion.matches;
        let slider = null;
        let visible = false;
        let animations = [];

        function updatePlaybackButton() {
            const playing = Boolean(slider?.autoplay.running);
            playbackButton.setAttribute("aria-pressed", String(playing));
            playbackButton.setAttribute("aria-label", playing ? "자동 재생 일시정지" : "자동 재생 시작");
        }

        function updatePlayback() {
            if (!slider) return;
            if (visible && !document.hidden && !userPaused) slider.autoplay.start();
            else slider.autoplay.stop();
            updatePlaybackButton();
        }

        function hideCaptions() {
            animations.forEach((animation) => animation.cancel());
            animations = [];
            captions.forEach((caption, index) => {
                caption.style.opacity = "0";
                slides[index].setAttribute("aria-hidden", String(index !== slider?.activeIndex));
            });
        }

        function revealCaption() {
            hideCaptions();
            if (!slider || !visible) return;
            const caption = captions[slider.activeIndex];
            caption.style.opacity = "1";
            if (!reducedMotion.matches) {
                animations.push(
                    caption.animate(
                        [
                            { opacity: 0, transform: "translateY(48px)" },
                            { opacity: 1, transform: "translateY(0)" },
                        ],
                        { delay: 100, duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
                    ),
                );
            }
        }

        function updateSlider() {
            if (mobile.matches && window.Swiper && !slider) {
                container.setAttribute("aria-label", "미어캐치 가치: 좌우로 넘겨 보기");
                container.setAttribute("tabindex", "0");
                slider = new window.Swiper(container, {
                    init: false,
                    wrapperClass: "cards",
                    slideClass: "card",
                    slideActiveClass: "on",
                    slideNextClass: "is-raised",
                    slidePrevClass: "is-hovered",
                    slideVisibleClass: "is-dark",
                    slideFullyVisibleClass: "is-expanded",
                    maxBackfaceHiddenSlides: 0,
                    slidesPerView: 1,
                    spaceBetween: 0,
                    speed: reducedMotion.matches ? 0 : 450,
                    rewind: true,
                    autoplay: { delay: 4500, disableOnInteraction: false },
                    // 자동 생성되는 알림 노드 대신 기존 요소의 접근성 속성을 사용합니다.
                    a11y: false,
                    createElements: false,
                    on: {
                        init(instance) {
                            // 라이브러리 기본 클래스를 추가하지 않고 기존 선택자로 스타일링합니다.
                            instance.el.classList.remove(...instance.classNames);
                            instance.classNames = [];
                        },
                        slideChange: hideCaptions,
                        transitionEnd: revealCaption,
                        autoplayStart: updatePlaybackButton,
                        autoplayStop: updatePlaybackButton,
                    },
                });
                cards.style.overflow = "visible";
                cards.style.scrollSnapType = "none";
                buttons.style.display = "flex";
                slider.init();
                controls.forEach((button) => {
                    button.hidden = false;
                });
                updatePlayback();
                revealCaption();
            } else if (!mobile.matches && slider) {
                slider.destroy(true, true);
                slider = null;
                buttons.style.removeProperty("display");
                cards.style.removeProperty("overflow");
                cards.style.removeProperty("scroll-snap-type");
                controls.forEach((button) => {
                    button.hidden = true;
                });
                updatePlaybackButton();
                animations.forEach((animation) => animation.cancel());
                animations = [];
                captions.forEach((caption) => caption.style.removeProperty("opacity"));
                slides.forEach((slide) => slide.removeAttribute("aria-hidden"));
                container.removeAttribute("aria-label");
                container.removeAttribute("tabindex");
            }
            window.ScrollTrigger?.refresh();
        }

        new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
                if (slider) {
                    if (visible && !slider.animating) revealCaption();
                    else hideCaptions();
                }
                updatePlayback();
            },
            { threshold: 0.5 },
        ).observe(container);
        controls.forEach((button) =>
            button.addEventListener("click", () => {
                if (!slider) return;
                if (button.classList.contains("previous")) slider.slidePrev();
                if (button.classList.contains("next")) slider.slideNext();
                if (button.classList.contains("autoplay")) {
                    userPaused = slider.autoplay.running;
                    updatePlayback();
                }
            }),
        );
        document.addEventListener("visibilitychange", updatePlayback);
        container.addEventListener("keydown", (event) => {
            if (!slider || event.target !== container) return;
            if (event.key === "ArrowRight") {
                event.preventDefault();
                slider.slideNext();
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                slider.slidePrev();
            }
        });
        reducedMotion.addEventListener("change", () => {
            userPaused = reducedMotion.matches;
            if (slider) {
                slider.params.speed = reducedMotion.matches ? 0 : 450;
                revealCaption();
            }
            updatePlayback();
        });
        mobile.addEventListener("change", updateSlider);
        updateSlider();
    }

    // Start: 첫번째 섹션의 이미지가 스크롤 시 글씨를 덮으며 전체 영역으로 확대
    function initHeroAnimation() {
        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
            const $pin = $(".visual-pin").first();
            const $copy = $pin.children(".visual-contents").first();
            const $imageFrame = $pin.find(".visual-img-animation").first();
            const $image = $pin.find(".visual-img").first();
            const $header = $(".header").first();
            if (!$pin.length || !$copy.length || !$imageFrame.length || !$image.length) return;
            $pin.addClass("has-scroll-animation");

            const updateCopyLayout = () => {
                const availableHeight = window.innerHeight - ($header.outerHeight() ?? 0);
                const copyHeight = $copy.outerHeight();
                const copyOffset = parseFloat(getComputedStyle($pin.get(0)).getPropertyValue("--visual-copy-offset"));
                const copyTop = Math.min(copyOffset, Math.max(24, (availableHeight - copyHeight) / 2));
                // 원본과 이미지 안의 흰색 글씨가 같은 위치를 유지합니다.
                $pin.css({
                    "--visual-copy-top": `${copyTop}px`,
                    "--visual-copy-height": `${copyHeight}px`,
                });
            };
            updateCopyLayout();
            ScrollTrigger.addEventListener("refreshInit", updateCopyLayout);

            const timeline = gsap.timeline({
                paused: true,
                defaults: { duration: 0.35, ease: "none" },
            });
            timeline.fromTo($imageFrame, { clipPath: "inset(70% 4% 0% 4% round 24px 24px 0px 0px)" }, { clipPath: "inset(20% 15% 20% 15% round 24px 24px 24px 24px)" }, "key").fromTo($image, { scale: 1.1 }, { scale: 1 }, "key").fromTo(
                $imageFrame,
                { clipPath: "inset(20% 15% 20% 15% round 24px 24px 24px 24px)" },
                {
                    clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)",
                    immediateRender: false,
                },
                "key2",
            );
            timeline.eventCallback("onComplete", () => {
                $pin.addClass("is-expanded");
                updateQuickNavTheme();
            });

            let started = false;
            let lastWheelTime = -Infinity;
            let touchStart = null;
            let consumingTouch = false;
            const listeners = new AbortController();
            const inputOptions = { passive: false, signal: listeners.signal };

            function shrinkImage() {
                started = false;
                lastWheelTime = -Infinity;
                timeline.reverse();
                $pin.removeClass("is-expanded");
                updateQuickNavTheme();
            }

            function beginGesture(event, downward) {
                if (window.scrollY > 1 || !event.cancelable || event.defaultPrevented) return false;
                if (!downward) {
                    if (!started) return false;
                    event.preventDefault();
                    shrinkImage();
                    return true;
                }
                if (started) {
                    if (timeline.progress() < 1) timeline.progress(1).pause();
                    return false;
                }
                event.preventDefault();
                started = true;
                timeline.play();
                return true;
            }

            function onWheel(event) {
                if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
                const now = performance.now();
                // 휠 이벤트에는 종료 신호가 없어 짧은 간격의 관성 입력을 한 동작으로 묶습니다.
                if (event.deltaY > 0 && now - lastWheelTime < 180 && window.scrollY <= 1) {
                    if (event.cancelable) event.preventDefault();
                    lastWheelTime = now;
                } else if (beginGesture(event, event.deltaY > 0) && event.deltaY > 0) {
                    lastWheelTime = now;
                }
            }

            const pin = $pin.get(0);
            window.addEventListener("wheel", onWheel, inputOptions);
            pin.addEventListener(
                "touchstart",
                (event) => {
                    touchStart = event.touches.length === 1 ? event.touches[0] : null;
                    consumingTouch = false;
                },
                { passive: true, signal: listeners.signal },
            );
            pin.addEventListener(
                "touchmove",
                (event) => {
                    if (!touchStart || event.touches.length !== 1) return;
                    if (consumingTouch) {
                        if (event.cancelable) event.preventDefault();
                        return;
                    }
                    const dy = touchStart.clientY - event.touches[0].clientY;
                    const dx = touchStart.clientX - event.touches[0].clientX;
                    if (Math.abs(dy) > Math.abs(dx)) consumingTouch = beginGesture(event, dy > 0);
                },
                inputOptions,
            );

            // 링크 이동·키보드 등 기본 스크롤을 허용하고, 맨 위로 돌아오면 다시 준비합니다.
            let atTop = true;
            const syncPagePosition = () => {
                const nextAtTop = window.scrollY <= 1;
                if (nextAtTop === atTop) return;
                atTop = nextAtTop;
                if (atTop) {
                    shrinkImage();
                    return;
                }
                started = true;
                lastWheelTime = -Infinity;
                timeline.pause().progress(1);
                $pin.addClass("is-expanded");
                updateQuickNavTheme();
            };
            window.addEventListener("scroll", syncPagePosition, { passive: true, signal: listeners.signal });
            syncPagePosition();

            return () => {
                listeners.abort();
                ScrollTrigger.removeEventListener("refreshInit", updateCopyLayout);
                $pin.removeClass("has-scroll-animation is-expanded").css({
                    "--visual-copy-top": "",
                    "--visual-copy-height": "",
                });
                updateQuickNavTheme();
            };
        });
    }

    // End: 첫번째 섹션의 이미지가 스크롤 시 글씨를 덮으며 전체 영역으로 확대

    // Start: 두번째 섹션의 카드 AOS 효과
    function initNewsCardsAnimation() {
        if (!window.AOS) return;

        // Derive exit timing from the entrance delays so their order stays in sync.
        $(".news-cards").each(function () {
            const $cards = $(this).find(".news-card[data-aos]");
            const delays = $cards.map((index, card) => Number($(card).attr("data-aos-delay")) || 0).get();
            const lastDelay = Math.max(0, ...delays);
            $cards.each(function (index) {
                $(this).css("--news-exit-delay", `${lastDelay - delays[index]}ms`);
            });
        });

        AOS.init({
            offset: 160,
            duration: 700,
            easing: "ease-out-cubic",
            once: false,
            mirror: true,
            anchorPlacement: "top-bottom",
        });

        // Recalculate AOS positions after the hero's pinned scroll space changes.
        if (window.ScrollTrigger) {
            ScrollTrigger.addEventListener("refresh", () => AOS.refresh());
        }
        if (document.readyState === "complete") AOS.refresh();
        else $window.one("load.newsCards", () => AOS.refresh());
    }
    // End: 두번째 섹션의 카드 AOS 효과

    // Start: 두번째 섹션의 각 카드 호버·키보드 포커스 강조 및 겹침 복귀
    function initNewsCardsHover() {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        $(".news-card").each(function () {
            const $card = $(this);
            const $image = $card.find("img").first();
            if (!$image.length) return;
            let pointerInside = false;
            let resetTimer;

            const resetLayer = () => {
                if (!$card.hasClass("is-hovered")) {
                    $card.removeClass("is-raised");
                }
            };
            const update = () => {
                clearTimeout(resetTimer);
                const active = pointerInside || $card.is(":focus-visible");
                $card.toggleClass("is-hovered", active);
                if (active) {
                    $card.addClass("is-raised");
                } else if (reducedMotion.matches) {
                    resetLayer();
                } else {
                    // Fallback if the transition is interrupted or has no size change.
                    resetTimer = setTimeout(resetLayer, 320);
                }
            };
            $card
                .on("pointerenter.newsCards", (event) => {
                    if (event.pointerType === "touch") return;
                    pointerInside = true;
                    update();
                })
                .on("pointerleave.newsCards pointercancel.newsCards", () => {
                    pointerInside = false;
                    update();
                })
                .on("focus.newsCards", () => requestAnimationFrame(update))
                .on("blur.newsCards", update);
            $image.on("transitionend.newsCards", (event) => {
                if (event.originalEvent?.propertyName === "transform") resetLayer();
            });
        });
    }
    // End: 두번째 섹션의 각 카드 호버·키보드 포커스 강조 및 겹침 복귀

    // Start:  세번째 섹션 스크롤 시  글씨 색 변경하는 효과
    function initScrollTitleAnimation() {
        if (!window.gsap || !window.ScrollTrigger) return;

        const $titles = $(".scroll-title-area .scroll-title-ani");
        if (!$titles.length) return;

        gsap.registerPlugin(ScrollTrigger);

        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
            $titles.each(function () {
                const $title = $(this);
                const $text = $title.find(".scroll-title").first();
                const $area = $title.closest(".contents-wrap");
                if (!$text.length || !$area.length) return;

                gsap.fromTo(
                    $text,
                    { "--fill-progress": "0%" },
                    {
                        "--fill-progress": "100%",
                        ease: "none",
                        scrollTrigger: {
                            trigger: $area.get(0),
                            start: "center center",
                            end: "+=80%",
                            pin: $title.closest(".scroll-title-area").get(0),
                            scrub: 0.6,
                            invalidateOnRefresh: true,
                        },
                    },
                );
            });
        });

        document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }
    // End:  세번째 섹션  스크롤 시  글씨 색 변경하는 효과

    // Start: 제목과 이미지를 하나의 중앙 콘텐츠로 축소한 뒤 좌우 카드를 표시
    function initSolutionAnimation() {
        if (!window.gsap || !window.ScrollTrigger) return;

        const $area = $(".solution-area").first();
        if (!$area.length) return;

        gsap.registerPlugin(ScrollTrigger);
        gsap.matchMedia().add("(min-width: 1281px) and (prefers-reduced-motion: no-preference)", () => {
            const $center = $area.find(".solution-center").first();
            const $left = $area.find(".box-wrap.left").first();
            const $right = $area.find(".box-wrap.right").first();
            const $title = $area.find(".scroll-title").first();
            const $highlights = $area.find(".box.gradientbg");
            const $header = $(".header").first();
            if (!$center.length || !$left.length || !$right.length || !$title.length) return;
            const $leftCards = $left.find(".box:not(.gradientbg)");
            const $rightCards = $right.find(".box:not(.gradientbg)");
            const $cards = $leftCards.add($rightCards);
            const getTravelDistance = () => gsap.utils.clamp(180, 320, window.innerHeight * 0.32);

            gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                    trigger: $area.get(0),
                    pin: true,
                    start: () => `top ${$header.outerHeight() ?? 0}px`,
                    end: () => `+=${window.innerHeight * 2}`,
                    scrub: 0.5,
                    invalidateOnRefresh: true,
                },
            })
                // 기본 64px 제목이 축소 완료 시 56px로 보이도록 함께 축소합니다.
                .fromTo($center, { scale: 1 }, { scale: 56 / 64, duration: 0.8 }, 0)
                .fromTo($title, { "--fill-progress": "0%" }, { "--fill-progress": "100%", duration: 0.8 }, 0)
                // 먼저 카드를 드러낸 뒤 충분한 거리를 이동시켜 방향감을 살립니다.
                .fromTo($cards, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.2)
                .fromTo($leftCards, { y: () => -getTravelDistance() }, { y: 0, duration: 1.4 }, 0.2)
                .fromTo($rightCards, { y: getTravelDistance }, { y: 0, duration: 1.4 }, 0.2)
                // 강조 박스는 일반 카드의 이동이 끝난 뒤 별도로 표시합니다.
                .fromTo($highlights, { autoAlpha: 0, y: -100 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "sine.inOut" }, ">")
                // 완성된 배치를 읽을 수 있도록 고정 상태를 잠시 유지합니다.
                .to({}, { duration: 0.15 });
        });

        const $image = $area.find("img").first();
        if ($image.length && !$image.prop("complete")) {
            $image.one("load.solution", () => ScrollTrigger.refresh());
        }
    }
    // End: 제목과 이미지를 하나의 중앙 콘텐츠로 축소한 뒤 좌우 카드를 표시

    // 펼쳐진 이미지가 퀵 메뉴 뒤를 덮는 동안에만 밝은 글씨를 사용합니다.
    function updateQuickNavTheme() {
        const $nav = $(".quick-nav").first();
        const $hero = $(".visual-pin.is-expanded").first();
        if (!$nav.length) return;

        const $heroSection = $hero.closest("section");
        const activeTarget = $nav.find(".quick-menu.on").first().attr("data-target");
        let isDark = false;
        if ($heroSection.length && activeTarget === `#${$heroSection.attr("id")}`) {
            const heroTop = $hero.offset().top;
            const navCenter = $nav.offset().top + $nav.outerHeight() / 2;
            isDark = heroTop <= navCenter && heroTop + $hero.outerHeight() >= navCenter;
        }
        $nav.toggleClass("is-dark", isDark);
    }

    // 퀵 메뉴 효과
    function initQuickNav() {
        const $nav = $(".quick-nav").first();
        if (!$nav.length) return;

        // 실제 메뉴에 연결된 섹션만 추적합니다.
        const items = $nav
            .find("[data-target]")
            .map(function () {
                const $link = $(this);
                const target = $link.attr("data-target");
                const $section = target.startsWith("#") && target.length > 1 ? $(`#${$.escapeSelector(target.slice(1))}`) : $();
                return $section.is("section") ? { $link, $section } : null;
            })
            .get();
        if (!items.length) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const $header = $(".header").first();
        const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape"]);
        let framePending = false;
        let scrollTween = null;
        let menuScroll = null;
        let activeItem = null;
        let activationOffset = 0;
        let maxScroll = 0;

        function getSectionOffset($section) {
            const customOffset = Number.parseFloat($section.attr("data-offset"));
            return Number.isFinite(customOffset) ? customOffset : ($header.outerHeight() ?? 100);
        }

        function refreshSectionPositions() {
            maxScroll = Math.max(0, $page.prop("scrollHeight") - window.innerHeight);
            // 헤더에 닿을 때까지 기다리지 않고 화면 중앙에 들어온 섹션을 표시합니다.
            activationOffset = Math.max($header.outerHeight() ?? 0, window.innerHeight / 2);
            items.forEach((item) => {
                // 섹션 자체가 pin되면 화면 좌표가 움직이므로 원래 자리를 유지하는 spacer를 사용합니다.
                const $spacer = item.$section.parent(".pin-spacer");
                item.top = ($spacer.length ? $spacer : item.$section).offset().top;
                item.scrollTop = Math.max(0, Math.min(item.top - getSectionOffset(item.$section), maxScroll));
            });
            scheduleUpdate();
        }

        function setActiveItem(item) {
            if (activeItem !== item) {
                activeItem?.$link.removeClass("on").removeAttr("aria-current");
                item.$link.addClass("on").attr("aria-current", "location");
                activeItem = item;
            }
            updateQuickNavTheme();
        }

        function stopMenuScroll() {
            if (menuScroll && !scrollTween) $window.scrollTop($window.scrollTop());
            scrollTween?.kill();
            scrollTween = null;
            menuScroll = null;
            $window.off(".quickNavScroll");
            scheduleUpdate();
        }

        function stopOnScrollKey(event) {
            if ($(event.target).closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])").length) return;
            if (scrollKeys.has(event.key)) stopMenuScroll();
        }

        function scrollToSection(item) {
            stopMenuScroll();
            refreshSectionPositions();

            const targetY = item.scrollTop;
            const position = { y: $window.scrollTop() };
            setActiveItem(item);
            if (reducedMotion.matches || Math.abs(targetY - position.y) < 1) {
                $window.scrollTop(targetY);
                checkActiveSection();
                return;
            }

            // 도착하거나 사용자가 이동을 중단할 때까지 클릭한 메뉴를 유지합니다.
            menuScroll = { item, targetY };
            // 이동 중에만 등록하며, 다른 이벤트를 지우지 않도록 전용 네임스페이스를 사용합니다.
            $window.on("wheel.quickNavScroll touchstart.quickNavScroll pointerdown.quickNavScroll", stopMenuScroll).on("keydown.quickNavScroll", stopOnScrollKey);

            if (!window.gsap) {
                // jQuery slim에는 animate가 없으므로 브라우저의 부드러운 스크롤을 사용합니다.
                window.scrollTo({ top: targetY, behavior: "smooth" });
                return;
            }

            // 모든 메뉴는 같은 시간으로 해당 섹션까지 이동합니다.
            scrollTween = gsap.to(position, {
                y: targetY,
                duration: 0.7,
                ease: "sine.inOut",
                onUpdate: () => $window.scrollTop(position.y),
                onComplete: stopMenuScroll,
            });
        }

        function checkActiveSection() {
            framePending = false;
            const scrollTop = $window.scrollTop();
            if (menuScroll) {
                if (Math.abs(scrollTop - menuScroll.targetY) > 1) {
                    setActiveItem(menuScroll.item);
                    return;
                }
                stopMenuScroll();
            }
            let currentItem = items[0];

            if (maxScroll > 0 && scrollTop >= maxScroll - 2) {
                currentItem = items[items.length - 1];
            } else {
                items.forEach((item) => {
                    if (item.top <= scrollTop + activationOffset + 1) currentItem = item;
                });
            }

            setActiveItem(currentItem);
        }

        function scheduleUpdate() {
            if (framePending) return;
            framePending = true;
            requestAnimationFrame(checkActiveSection);
        }

        items.forEach((item) => {
            const { $link } = item;
            $link.removeClass("on").removeAttr("aria-current").attr("href", $link.attr("data-target"));
            $link.on("click.quickNav", (event) => {
                if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                scrollToSection(item);
            });
        });

        refreshSectionPositions();
        checkActiveSection();
        $window.on("scroll.quickNav", scheduleUpdate).on("resize.quickNav", () => {
            stopMenuScroll();
            refreshSectionPositions();
        });
        if (document.readyState === "complete") refreshSectionPositions();
        else $window.one("load.quickNav", refreshSectionPositions);
        document.fonts?.ready.then(refreshSectionPositions);
        $(reducedMotion).on("change.quickNav", () => {
            stopMenuScroll();
            refreshSectionPositions();
        });
        window.ScrollTrigger?.addEventListener("refreshInit", stopMenuScroll);
        window.ScrollTrigger?.addEventListener("refresh", refreshSectionPositions);
    }
});
