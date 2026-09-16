/*-----------------------------------------------------------------------------------
    Template Name: RevelTek
    Template URI: https://webtend.net/demo/html/finsa
    Author: WebTend
    Author URI: https://webtend.net/
    Version: 1.0

	Note: This is Main js File For custom and jQuery plugins activation Code..
-----------------------------------------------------------------------------------

/*---------------------------
	JS INDEX
	===================
	01. Main Menu
	02. OffCanvasMenu
	03. Banner Slider
	04. Bootstrap accordion
	05. Popup video
	06. Counter Up
	07. Team Slider
	08. Testimonial Slider
	09. Client Logo Slider
	10. Easy PieChart
	11. LaestPost Slider
	12. fact isotope activation
	13. Active Progress Bar
	14. Project Isotope
	15. Price Range
	16. Product Gallery Slider
	17. Related Product Slider
	18. Quantity Increment
	19. Back to top
	20. Sticky Header
	21. Preloader and init Wow
	22. Wow Js

-----------------------------*/


(function ($) {
	'use strict';

	/* View Transitions: the Astro ClientRouter swaps page DOM without a full
	   reload, so these deferred bundles execute once while fresh markup
	   arrives on every navigation. Each initializer below is idempotent
	   (skips missing or already-initialized elements) and the full set is
	   exposed as window.RevelWidgets.init(), re-invoked on astro:page-load
	   by the MobileNav vanilla island. */
	function skipSlick($el) {
		return !$el.length || $el.hasClass('slick-initialized');
	}
	function initSlick($el, opts) {
		if (!skipSlick($el)) $el.slick(opts);
	}

	/*-----------------------------
	=== ALL ESSENTIAL FUNCTIONS ===
	------------------------------*/
	// ===== 01. Main Menu
	function mianMenu() {
		// Zero-dependency vanilla island owns this when present
		// (src/components/islands/MobileNav.astro). Skip so the mobile
		// .dd-trigger is injected exactly once.
		if (document.querySelector('[data-island="mobile-nav"]')) return;
		// Variables
		var var_window = $(window),
			navContainer = $('.nav-container'),
			pushedWrap = $('.nav-pushed-item'),
			pushItem = $('.nav-push-item'),
			pushedHtml = pushItem.html(),
			pushBlank = '',
			navbarToggler = $('.navbar-toggler'),
			navMenu = $('.nav-menu'),
			navMenuLi = $('.nav-menu ul li'),
			closeIcon = $('.navbar-close');

		// navbar toggler
		navbarToggler.on('click', function () {
			navbarToggler.toggleClass('active');
			navMenu.toggleClass('menu-on');
		});

		// close icon
		closeIcon.on('click', function () {
			navMenu.removeClass('menu-on');
			navbarToggler.removeClass('active');
		});

		// adds toggle button to li items that have children
		navMenu.find('li a').each(function () {
			if ($(this).next().length > 0) {
				$(this)
					.parent('li')
					.append(
						'<span class="dd-trigger"><i class="fal fa-angle-down"></i></span>'
					);
			}
		});

		// expands the dropdown menu on each click
		navMenu.find('li .dd-trigger').on('click', function (e) {
			e.preventDefault();
			$(this)
				.parent('li')
				.children('ul')
				.stop(true, true)
				.slideToggle(350);
			$(this).parent('li').toggleClass('active');
		});

		// check browser width in real-time
		function breakpointCheck() {
			var windoWidth = window.innerWidth;
			if (windoWidth <= 991) {
				navContainer.addClass('breakpoint-on');
			} else {
				navContainer.removeClass('breakpoint-on');
			}

			if (windoWidth <= 767) {
				pushedWrap.html(pushedHtml);
				pushItem.hide();
			} else {
				pushedWrap.html(pushBlank);
				pushItem.show();
			}
		}

		breakpointCheck();
		var_window.on('resize', function () {
			breakpointCheck();
		});
	}

	// ===== 02. OffCanvasMenu
	function offcanvasMenu() {
		// Owned by the MobileNav vanilla island when present.
		if (document.querySelector('[data-island="mobile-nav"]')) return;
		// Set Click Function For open
		$('.offcanvas-toggler').on('click', function (e) {
			e.preventDefault();
			$('.offcanvas-wrapper').addClass('show-offcanvas');
			$('.offcanvas-overly').addClass('show-overly');
		});
		// Set Click Function For Close
		$('.offcanvas-close').on('click', function (e) {
			e.preventDefault();
			$('.offcanvas-overly').removeClass('show-overly');
			$('.offcanvas-wrapper').removeClass('show-offcanvas');
		});
		// Set Click Function on Overly For open on
		$('.offcanvas-overly').on('click', function (e) {
			$(this).removeClass('show-overly');
			$('.offcanvas-wrapper').removeClass('show-offcanvas');
		});
	}

	// ===== 03. Banner Slider
	function bannerSlider() {
		var banner = $('#bannerSlider');
		if (skipSlick(banner)) return;
		var bannerFirst = $('.single-banner:first-child');

		banner.on('init', function (e, slick) {
			var firstAnimatingElements = bannerFirst.find(
				'[data-animation]'
			);
			slideanimate(firstAnimatingElements);
		});

		banner.on('beforeChange', function (
			e,
			slick,
			currentSlide,
			nextSlide
		) {
			var animatingElements = $(
				'div.slick-slide[data-slick-index="' + nextSlide + '"]'
			).find('[data-animation]');
			slideanimate(animatingElements);
		});

		banner.slick({
			infinite: true,
			slidesToShow: 1,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: true,
			fade: false,
			dots: false,
			swipe: true,
			adaptiveHeight: true,
			nextArrow: '<button class="slick-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button>',
			prevArrow: '<button class="slick-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button>',
			responsive: [{
				breakpoint: 768,
				settings: {
					arrows: false
				}
			}],
		});
	}

	function slideanimate(elements) {
		var animationEndEvents =
			'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		elements.each(function () {
			var $this = $(this);
			var animationDelay = $this.data('delay');
			var animationType = 'animated ' + $this.data('animation');
			$this.css({
				'animation-delay': animationDelay,
				'-webkit-animation-delay': animationDelay,
			});
			$this
				.addClass(animationType)
				.one(animationEndEvents, function () {
					$this.removeClass(animationType);
				});
		});
	}

	// ===== 04. Bootstrap accordion
	function bootstrapAccordion() {
		// Namespaced so re-init across View Transitions never double-binds.
		$('.accordion').off('hide.bs.collapse.revel show.bs.collapse.revel').on('hide.bs.collapse.revel show.bs.collapse.revel', (e) => {
			$(e.target).prev().find('i').toggleClass('fa-minus fa-plus');
			$(e.target).prev().toggleClass('active-header');
		});
	}

	// ===== 05. Popup video
	function popupVideo() {
		$('.popup-video').not('[data-mfp-init]').attr('data-mfp-init', '1').magnificPopup({
			type: 'iframe',
		});
	}
	function popupImg() {
		$('.img-popup').not('[data-mfp-init]').attr('data-mfp-init', '1').magnificPopup({
			type: "image",
			gallery: { 
				enabled: true 
			}
		});
	}
	// ===== 06. Counter Up
	function counterToUp() {
		// Owned by the Counters vanilla island when present
		// (IntersectionObserver, no jQuery/inview dependency).
		if (document.querySelector('[data-island="counters"]')) return;
		$('.fact-box').bind('inview', function (
			event,
			visible,
			visiblePartX,
			visiblePartY
		) {
			if (visible) {
				$(this)
					.find('.counter')
					.each(function () {
						var $this = $(this);
						$({
							Counter: 0
						}).animate({
							Counter: $this.text()
						}, {
							duration: 2000,
							easing: 'swing',
							step: function () {
								$this.text(Math.ceil(this.Counter));
							},
						});
					});
				$(this).unbind('inview');
			}
		});
	}

	// ===== 07. Team Slider
	function teamSlider() {
		var slideOne = $('#teamSliderOne');
		initSlick(slideOne, {
			infinite: true,
			slidesToShow: 4,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: false,
			fade: false,
			dots: false,
			swipe: true,
			responsive: [{
					breakpoint: 991,
					settings: {
						slidesToShow: 3,
					},
				},
				{
					breakpoint: 767,
					settings: {
						slidesToShow: 2,
					},
				},
			],
		});

		var slideTwo = $('#teamSliderTwo');
		initSlick(slideTwo, {
			infinite: true,
			slidesToShow: 5,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: false,
			fade: false,
			dots: false,
			swipe: true,
			responsive: [{
					breakpoint: 1600,
					settings: {
						slidesToShow: 4,
					},
				},
				{
					breakpoint: 992,
					settings: {
						slidesToShow: 3,
					},
				},
				{
					breakpoint: 768,
					settings: {
						slidesToShow: 2,
					},
				},
				{
					breakpoint: 576,
					settings: {
						slidesToShow: 1,
						centerMode: true,
					},
				},
			],
		});
	}

	// ===== 08. Testimonial Slider
	function testimonialSlider() {
		var slideOne = $('#testimonialSliderOne');
		var arrowsHtml = $('.testimonial-arrows');
		initSlick(slideOne, {
			infinite: true,
			slidesToShow: 1,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: true,
			fade: false,
			dots: false,
			swipe: true,
			appendArrows: arrowsHtml,
			nextArrow: '<div class="col-12 order-1"><button class="slick-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button></div>',
			prevArrow: '<div class="col-12 order-2"><button class="slick-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button></div>',
		});

		var slideTwo = $('#testimonialSliderTwo');
		var slideDots = $('.testimonial-dots');
		initSlick(slideTwo, {
			infinite: true,
			slidesToShow: 1,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: true,
			fade: false,
			dots: true,
			swipe: true,
			nextArrow: '<button class="slick-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button>',
			prevArrow: '<button class="slick-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button>',
			appendDots: slideDots,
			responsive: [
				{
					breakpoint: 991,
					settings: {
						arrows: false
					}
				},
				{
				breakpoint: 576,
				settings: {
					arrows: false
				}
			}],
			customPaging: function (slick, index) {
				var portrait = $(slick.$slides[index]).data('thumb');
				return '<img src=" ' + portrait + ' "/>';
			},
		});

		var slideThree = $('#testimonialSliderThree');
		initSlick(slideThree, {
			infinite: true,
			slidesToShow: 1,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: true,
			fade: false,
			dots: false,
			swipe: true,
			nextArrow: '<button class="slick-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button>',
			prevArrow: '<button class="slick-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button>',
			responsive: [{
				breakpoint: 576,
				settings: {
					arrows: false
				}
			}],
		});

	}

	// ===== 09. Client Logo Slider
	function clientSlider() {
		// Owned by the ClientSlider vanilla island when present
		// (scroll-snap strip, no slick dependency).
		if (document.querySelector('[data-island="client-slider"]')) return;
		var slide = $('#clientSlider');
		initSlick(slide, {
			infinite: true,
			slidesToShow: 5,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: false,
			fade: false,
			dots: false,
			swipe: true,
			responsive: [{
					breakpoint: 991,
					settings: {
						slidesToShow: 4,
					},
				},
				{
					breakpoint: 767,
					settings: {
						slidesToShow: 3,
					},
				},
				{
					breakpoint: 576,
					settings: {
						slidesToShow: 2,
					},
				},
				{
					breakpoint: 400,
					settings: {
						slidesToShow: 1,
					},
				},
			],
		});
	}

	// ===== 10. Easy PieChart
	function easypieChart() {
		$('.chart-box').not('[data-inview-init]').attr('data-inview-init', '1').bind('inview', function (
			event,
			visible,
			visiblePartX,
			visiblePartY
		) {
			if (visible) {
				$('.chart').easyPieChart({
					scaleLength: 0,
					lineWidth: 30,
					trackWidth: 20,
					size: 220,
					lineCap: 'square',
					rotate: 360,
					trackColor: '#e8e8e8',
					barColor: '#ff4a17',
				});
				$(this).unbind('inview');
			}
		});
	}

	// ===== 11. LaestPost Slider
	function latestPostSlider() {
		var slide = $('#latestPostSlider');
		initSlick(slide, {
			infinite: true,
			slidesToShow: 4,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			speed: 500,
			arrows: false,
			fade: false,
			dots: false,
			swipe: true,
			nextArrow: '<div class="col-12 order-1"><button class="slick-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button></div>',
			prevArrow: '<div class="col-12 order-2"><button class="slick-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button></div>',
			responsive: [{
					breakpoint: 1600,
					settings: {
						slidesToShow: 3,
					},
				},
				{
					breakpoint: 992,
					settings: {
						slidesToShow: 2,
					},
				},
				{
					breakpoint: 576,
					settings: {
						slidesToShow: 1,
						centerMode: true,
						centerPadding: '10%',
					},
				},
				{
					breakpoint: 400,
					settings: {
						slidesToShow: 1,
						centerMode: false,
					},
				},
			],
		});
	}

	// ===== 12. fact isotope activation
	function factIsotope() {
		var facts = $('#factIsotpe');
		if (facts.length && !facts.attr('data-iso-init')) {
			facts.attr('data-iso-init', '1');
			facts.isotope();
		}
	}

	// ===== 13. Active Progress Bar
	function progressBar() {
		$('.skill-progress-bars').not('[data-inview-init]').attr('data-inview-init', '1').bind('inview', function (
			event,
			visible,
			visiblePartX,
			visiblePartY
		) {
			if (visible) {
				$.each($('div.progressbar'), function () {
					$(this).css('width', $(this).attr('data-width') + '%');
				});
				$(this).unbind('inview');
			}
		});
	}

	// ===== 14. Project Isotope
	function projectIsotope() {
		var grid = $('.project-isotope');
		if (!grid.length || grid.attr('data-iso-init')) return;
		grid.attr('data-iso-init', '1');
		var items = grid.isotope({
			itemSelector: '.isotope-item',
			percentPosition: true,
			masonry: {
				columnWidth: '.isotope-item',
			},
		});
		// items on button click
		$('.project-isotope-filter').on('click', 'li', function () {
			var filterValue = $(this).attr('data-filter');
			items.isotope({
				filter: filterValue
			});
		});
		// menu active class
		$('.project-isotope-filter li').on('click', function (event) {
			$(this).siblings('.active').removeClass('active');
			$(this).addClass('active');
			event.preventDefault();
		});
	}

	// ===== 15. Price Range
	function priceRange() {
		var range = $('#slider-range');
		if (!range.length || range.hasClass('ui-slider')) return;
		range.slider({
			range: true,
			min: 40,
			max: 600,
			values: [60, 570],
			slide: function (event, ui) {
				$('#amount').val('$' + ui.values[0] + ' - $' + ui.values[1]);
			}
		});
		$('#amount').val(
			'$' +
			$('#slider-range').slider('values', 0) +
			' - $' +
			$('#slider-range').slider('values', 1)
		);
	}

	// ===== 16. Product Gallery Slider
	function gallerySlider() {
		var galleryDots = $('.product-gallery-arrow');
		initSlick($('.product-gallery-slider'), {
			slidesToShow: 1,
			slidesToScroll: 1,
			infinite: true,
			autoplay: true,
			autoplaySpeed: 6000,
			arrows: true,
			nextArrow: '<button class="slick-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button>',
			prevArrow: '<button class="slick-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button>',
			dots: true,
			appendDots: galleryDots,
			customPaging: function (slick, index) {
				var portrait = $(slick.$slides[index]).data('thumb');
				return '<img src=" ' + portrait + ' "/>';
			},
		});
	}

	// ===== 17. Related Product Slider
	function realatedProSLider() {
		var slider = $('.related-product-slider');
		initSlick(slider, {
			slidesToShow: 4,
			slidesToScroll: 1,
			infinite: true,
			autoplay: true,
			autoplaySpeed: 6000,
			arrows: false,
			dots: false,
			responsive: [{
					breakpoint: 992,
					settings: {
						slidesToShow: 3,
					},
				},
				{
					breakpoint: 768,
					settings: {
						slidesToShow: 2,
					},
				},
			],
		});
	}

	// ===== 18. Quantity Increment
	function quantityIncrement() {
		$('.quantity-down').not('[data-qty-init]').attr('data-qty-init', '1').on('click', function(){
			var numProduct = Number($(this).next().val());
			if(numProduct > 0) $(this).next().val(numProduct - 1);
		});

		$('.quantity-up').not('[data-qty-init]').attr('data-qty-init', '1').on('click', function(){
			var numProduct = Number($(this).prev().val());
			$(this).prev().val(numProduct + 1);
		});
	}

	// ===== 19. Back to top
	function gtToTop() {
		// Owned by the MobileNav vanilla island when present.
		if (document.querySelector('[data-island="mobile-nav"]')) return;
		$('.back-to-top').on('click', function (e) {
			$('html, body').animate({
					scrollTop: '0',
				},
				1200
			);

			e.preventDefault();
		});
	}

	// ===== 20. Sticky Header
	function stickyHeader() {
		// Owned by the MobileNav vanilla island when present.
		if (document.querySelector('[data-island="mobile-nav"]')) return;
		var sticky = $('header.sticky-header');
		var scrollFromtop = $(window).scrollTop();
		var scrollLimit = $('header').height() + 10;

		if (scrollFromtop < scrollLimit) {
			sticky.removeClass('sticky-on');
		} else {
			sticky.addClass('sticky-on');
		}
	}

	// ===== 21. Preloader and init Wow
	function preloader() {
		if ($('#preloader').length) {
			$('#preloader').delay(100).fadeOut(500);
		}
	}

	/* Re-runnable widget pass. Safe to call on every View Transition
	   (all initializers above are idempotent); invoked on first paint via
	   document.ready and on later swaps via astro:page-load from the
	   MobileNav vanilla island. */
	function initWidgets() {
		mianMenu()
		offcanvasMenu()
		bannerSlider()
		bootstrapAccordion()
		popupVideo()
		counterToUp()
		teamSlider()
		testimonialSlider()
		clientSlider()
		easypieChart()
		latestPostSlider()
		factIsotope()
		progressBar()
		projectIsotope()
		priceRange()
		gallerySlider()
		realatedProSLider()
		quantityIncrement()
		gtToTop()
		popupImg()
		initWow()
	}
	window.RevelWidgets = { init: initWidgets };

	// ===== 22. Wow Js (restartable: stops the previous page's instance so
	// swapped-in .wow elements animate instead of staying hidden)
	function initWow() {
		try {
			if (typeof WOW === 'undefined') return;
			if (window.__revelWow && window.__revelWow.stop) window.__revelWow.stop();
			window.__revelWow = new WOW();
			window.__revelWow.init();
		} catch (err) {
			if (window.console) window.console.warn('[reveltek] WOW init failed', err);
		}
	}

	/*---------------------
	=== DOCUMENT READY  ===
	----------------------*/
	$(document).ready(function () {
		initWidgets()
	});

	/*--------------------
	=== WINDOW SCROLL  ===
	----------------------*/
	$(window).on('scroll', function () {
		stickyHeader()
	});

	/*------------------
	=== WINDOW LOAD  ===
	--------------------*/
	$(window).on('load', function () {
		preloader();
		initWow();
	});

})(jQuery);