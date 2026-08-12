window.addEventListener(
	"DOMContentLoaded",
	() => {
		initTheme();
		initTimeline();
		initHobbies();
		initBackgroundMusic();
	}
);


/* =========================================================
   Theme
   ========================================================= */

function initTheme() {
	const button =
		document.getElementById(
			"toggleTheme"
		);

	const themeColorMeta =
		document.getElementById(
			"themeColorMeta"
		);


	if (!button) {
		return;
	}


	const preferenceKey =
		"themePreference";


	function getSystemTheme() {
		const mediaQuery =
			window.matchMedia(
				"(prefers-color-scheme: light)"
			);

		return mediaQuery.matches
			? "light"
			: "dark";
	}


	function getStoredTheme() {
		try {
			const value =
				localStorage.getItem(
					preferenceKey
				);

			return (
				value === "light" ||
				value === "dark"
			)
				? value
				: null;

		} catch (error) {
			return null;
		}
	}


	function updateThemeColor(
		theme
	) {
		if (!themeColorMeta) {
			return;
		}


		themeColorMeta.setAttribute(
			"content",
			theme === "light"
				? "#f1f0ed"
				: "#090a0d"
		);
	}


	function updateButton() {
		const currentTheme =
			document.documentElement
				.dataset.theme ||
			getSystemTheme();


		const isDark =
			currentTheme === "dark";


		button.textContent =
			isDark
				? "☀"
				: "☾";


		button.setAttribute(
			"aria-label",
			isDark
				? "Switch to light mode"
				: "Switch to dark mode"
		);


		updateThemeColor(
			currentTheme
		);
	}


	function applyTheme(
		theme,
		save = false
	) {
		document.documentElement
			.dataset.theme =
			theme;


		if (save) {
			try {
				localStorage.setItem(
					preferenceKey,
					theme
				);

			} catch (error) {
			}
		}


		updateButton();
	}


	const storedTheme =
		getStoredTheme();


	if (storedTheme) {

		applyTheme(
			storedTheme
		);

	} else if (
		!document.documentElement
			.dataset.theme
	) {

		applyTheme(
			getSystemTheme()
		);

	} else {

		updateButton();
	}


	button.addEventListener(
		"click",
		() => {
			const currentTheme =
				document.documentElement
					.dataset.theme ||
				getSystemTheme();


			const nextTheme =
				currentTheme === "dark"
					? "light"
					: "dark";


			applyTheme(
				nextTheme,
				true
			);
		}
	);


	const systemThemeQuery =
		window.matchMedia(
			"(prefers-color-scheme: light)"
		);


	if (
		systemThemeQuery
			.addEventListener
	) {
		systemThemeQuery
			.addEventListener(
				"change",
				() => {
					if (
						!getStoredTheme()
					) {
						applyTheme(
							getSystemTheme()
						);
					}
				}
			);
	}
}


/* =========================================================
   Timeline
   ========================================================= */

function initTimeline() {
	const timeline =
		document.getElementById(
			"timeline"
		);


	if (!timeline) {
		return;
	}


	function getControlledBody(
		button
	) {
		const id =
			button.getAttribute(
				"aria-controls"
			);


		if (!id) {
			return null;
		}


		return document
			.getElementById(id);
	}


	function setExpanded(
		button,
		expanded
	) {
		const body =
			getControlledBody(
				button
			);


		if (!body) {
			return;
		}


		button.setAttribute(
			"aria-expanded",
			expanded
				? "true"
				: "false"
		);


		body.setAttribute(
			"aria-hidden",
			expanded
				? "false"
				: "true"
		);


		body.classList.toggle(
			"timeline__item-body--expanded",
			expanded
		);
	}


	timeline.addEventListener(
		"click",
		event => {

			const actionButton =
				event.target.closest(
					"[data-action]"
				);


			if (
				actionButton &&
				timeline.contains(
					actionButton
				)
			) {
				const action =
					actionButton.getAttribute(
						"data-action"
					);


				const shouldExpand =
					action === "expand";


				const buttons =
					timeline.querySelectorAll(
						".timeline__arrow[aria-controls]"
					);


				buttons.forEach(
					button => {
						setExpanded(
							button,
							shouldExpand
						);
					}
				);


				return;
			}


			const itemButton =
				event.target.closest(
					".timeline__arrow"
				);


			if (
				!itemButton ||
				!timeline.contains(
					itemButton
				)
			) {
				return;
			}


			const currentlyExpanded =
				itemButton.getAttribute(
					"aria-expanded"
				) === "true";


			setExpanded(
				itemButton,
				!currentlyExpanded
			);
		}
	);
}


/* =========================================================
   Hobbies popup
   ========================================================= */

function initHobbies() {
	const openButton =
		document.getElementById(
			"openHobbies"
		);


	const closeButton =
		document.getElementById(
			"closeHobbies"
		);


	const popup =
		document.getElementById(
			"hobbiesPopup"
		);


	const overlay =
		document.getElementById(
			"overlay"
		);


	if (
		!openButton ||
		!closeButton ||
		!popup ||
		!overlay
	) {
		return;
	}


	let previousFocus =
		null;


	function getFocusableElements() {
		return Array.from(
			popup.querySelectorAll(
				'a[href], button:not([disabled])'
			)
		);
	}


	function openPopup() {
		previousFocus =
			document.activeElement;


		popup.classList.add(
			"is-open"
		);


		overlay.classList.add(
			"is-open"
		);


		popup.setAttribute(
			"aria-hidden",
			"false"
		);


		overlay.setAttribute(
			"aria-hidden",
			"false"
		);


		document.body.classList.add(
			"modal-open"
		);


		const focusable =
			getFocusableElements();


		if (
			focusable.length > 0
		) {
			focusable[0]
				.focus();
		}
	}


	function closePopup() {
		popup.classList.remove(
			"is-open"
		);


		overlay.classList.remove(
			"is-open"
		);


		popup.setAttribute(
			"aria-hidden",
			"true"
		);


		overlay.setAttribute(
			"aria-hidden",
			"true"
		);


		document.body.classList.remove(
			"modal-open"
		);


		if (
			previousFocus &&
			typeof previousFocus.focus ===
				"function"
		) {
			previousFocus.focus();
		}
	}


	function trapFocus(
		event
	) {
		if (
			event.key !== "Tab" ||
			!popup.classList.contains(
				"is-open"
			)
		) {
			return;
		}


		const focusable =
			getFocusableElements();


		if (
			focusable.length === 0
		) {
			return;
		}


		const first =
			focusable[0];


		const last =
			focusable[
				focusable.length - 1
			];


		if (
			event.shiftKey &&
			document.activeElement ===
				first
		) {
			event.preventDefault();

			last.focus();

		} else if (
			!event.shiftKey &&
			document.activeElement ===
				last
		) {
			event.preventDefault();

			first.focus();
		}
	}


	openButton.addEventListener(
		"click",
		openPopup
	);


	closeButton.addEventListener(
		"click",
		closePopup
	);


	overlay.addEventListener(
		"click",
		closePopup
	);


	document.addEventListener(
		"keydown",
		event => {

			if (
				event.key === "Escape" &&
				popup.classList.contains(
					"is-open"
				)
			) {
				closePopup();

				return;
			}


			trapFocus(
				event
			);
		}
	);
}


/* =========================================================
   Background music
   ========================================================= */

function initBackgroundMusic() {
	const audio =
		document.getElementById(
			"backgroundMusic"
		);


	if (!audio) {
		return;
	}


	const MUSIC_VOLUME =
		0.10;


	const FADE_DURATION =
		900;


	let unlocked =
		false;


	let fadeFrame =
		null;


	let playLock =
		false;


	audio.loop =
		true;


	audio.volume =
		MUSIC_VOLUME;


	try {
		audio.setAttribute(
			"playsinline",
			""
		);


		audio.setAttribute(
			"webkit-playsinline",
			""
		);

	} catch (error) {
	}


	/* fade */

	function fadeIn() {
		if (fadeFrame) {
			cancelAnimationFrame(
				fadeFrame
			);
		}


		audio.volume =
			0;


		const start =
			performance.now();


		function step(
			time
		) {
			const progress =
				Math.min(
					1,
					(
						time -
						start
					) /
					FADE_DURATION
				);


			audio.volume =
				MUSIC_VOLUME *
				progress;


			if (
				progress < 1
			) {
				fadeFrame =
					requestAnimationFrame(
						step
					);

			} else {
				audio.volume =
					MUSIC_VOLUME;


				fadeFrame =
					null;
			}
		}


		fadeFrame =
			requestAnimationFrame(
				step
			);
	}


	/* remove fallback listeners */

	const unlockEvents = [
		"pointerdown",
		"touchstart",
		"mousedown",
		"click",
		"keydown"
	];


	function removeUnlockListeners() {
		unlockEvents.forEach(
			eventName => {
				document.removeEventListener(
					eventName,
					unlockMusic,
					true
				);
			}
		);
	}


	/* fallback after first interaction */

	function unlockMusic() {
		if (
			unlocked ||
			document.hidden
		) {
			return;
		}


		audio.muted =
			false;


		audio.volume =
			0;


		let attempt;


		try {
			attempt =
				audio.play();

		} catch (error) {
			return;
		}


		function success() {
			unlocked =
				true;


			audio.muted =
				false;


			fadeIn();


			removeUnlockListeners();
		}


		if (
			attempt &&
			typeof attempt.then ===
				"function"
		) {
			attempt
				.then(
					success
				)
				.catch(
					() => {
					}
				);

		} else {
			success();
		}
	}


	unlockEvents.forEach(
		eventName => {
			document.addEventListener(
				eventName,
				unlockMusic,
				{
					capture: true,
					passive: true
				}
			);
		}
	);


	/* desktop audible autoplay attempt */

	async function attemptImmediateAutoplay() {
		audio.muted =
			false;


		audio.volume =
			MUSIC_VOLUME;


		try {
			await audio.play();


			unlocked =
				true;


			removeUnlockListeners();


			return;

		} catch (error) {
			/*
				The browser rejected
				audible autoplay.
			*/
		}


		/*
			Prepare muted playback.

			This usually succeeds on Chrome
			and Safari and leaves the audio
			ready for the first interaction.
		*/

		audio.muted =
			true;


		audio.volume =
			0;


		try {
			await audio.play();

		} catch (error) {
			/*
				No problem.

				The first interaction
				will try again.
			*/
		}
	}


	/* resume helper */

	async function resumeMusic() {
		if (
			!unlocked ||
			!audio.paused ||
			document.hidden ||
			playLock
		) {
			return;
		}


		playLock =
			true;


		try {
			await audio.play();

		} catch (error) {
		}


		playLock =
			false;
	}


	/* tab handling */

	document.addEventListener(
		"visibilitychange",
		() => {

			if (
				document.hidden
			) {
				audio.pause();

			} else {
				resumeMusic();
			}
		}
	);


	/* browser cache restore */

	window.addEventListener(
		"pageshow",
		() => {
			resumeMusic();
		}
	);


	/* focus */

	window.addEventListener(
		"focus",
		() => {
			resumeMusic();
		}
	);


	/* recover after ending */

	audio.addEventListener(
		"ended",
		() => {
			if (
				!unlocked ||
				document.hidden
			) {
				return;
			}


			try {
				audio.currentTime =
					0;

			} catch (error) {
			}


			resumeMusic();
		}
	);


	/* volume cap */

	audio.addEventListener(
		"volumechange",
		() => {

			if (
				!audio.muted &&
				audio.volume >
					MUSIC_VOLUME
			) {
				audio.volume =
					MUSIC_VOLUME;
			}
		}
	);


	audio.addEventListener(
		"error",
		() => {
			console.error(
				"Could not load audio.mp3"
			);
		}
	);


	attemptImmediateAutoplay();
}
