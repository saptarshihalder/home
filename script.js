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
				/*
					Local storage may not
					be available.
				*/
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

			/*
				Expand or collapse all.
			*/

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


			/*
				Individual item.
			*/

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


	let previousFocus = null;


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
			focusable[0].focus();
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


	/*
		Exactly 10 percent.
	*/

	const MUSIC_VOLUME =
		0.10;


	const FADE_DURATION =
		900;


	let unlocked =
		false;


	let tabHidden =
		document.hidden;


	let fadeFrame =
		null;


	let playLock =
		false;


	audio.loop =
		true;


	audio.volume =
		0;


	audio.muted =
		true;


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
		/*
			Ignore.
		*/
	}


	/* =====================================================
	   Fade the music in
	   ===================================================== */

	function fadeToVolume(
		targetVolume
	) {
		if (fadeFrame) {
			cancelAnimationFrame(
				fadeFrame
			);
		}


		const safeTarget =
			Math.min(
				MUSIC_VOLUME,
				Math.max(
					0,
					targetVolume
				)
			);


		const startingVolume =
			audio.volume;


		const startingTime =
			performance.now();


		function step(
			currentTime
		) {
			const progress =
				Math.min(
					1,
					(
						currentTime -
						startingTime
					) /
					FADE_DURATION
				);


			audio.volume =
				startingVolume +
				(
					safeTarget -
					startingVolume
				) *
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
					safeTarget;


				fadeFrame =
					null;
			}
		}


		fadeFrame =
			requestAnimationFrame(
				step
			);
	}


	/* =====================================================
	   Prepare muted autoplay
	   ===================================================== */

	function prepareMutedPlayback() {
		audio.muted =
			true;


		audio.volume =
			0;


		let playAttempt;


		try {
			playAttempt =
				audio.play();

		} catch (error) {
			return;
		}


		if (
			playAttempt &&
			typeof playAttempt.catch ===
				"function"
		) {
			playAttempt.catch(
				() => {
					/*
						The first interaction
						will try again.
					*/
				}
			);
		}
	}


	/* =====================================================
	   Try actual automatic audible playback
	   ===================================================== */

	function tryAudibleAutoplay() {
		audio.muted =
			false;


		audio.volume =
			MUSIC_VOLUME;


		let playAttempt;


		try {
			playAttempt =
				audio.play();

		} catch (error) {
			prepareMutedPlayback();

			return;
		}


		if (
			playAttempt &&
			typeof playAttempt.then ===
				"function"
		) {
			playAttempt
				.then(
					() => {
						unlocked =
							true;


						removeUnlockListeners();
					}
				)
				.catch(
					() => {
						prepareMutedPlayback();
					}
				);

		} else {
			unlocked =
				true;


			removeUnlockListeners();
		}
	}


	/* =====================================================
	   Unlock after the visitor touches the page

	   This is required by Safari, Chrome mobile and most
	   modern mobile browsers.
	   ===================================================== */

	function unlockInGesture() {
		if (
			unlocked ||
			tabHidden
		) {
			return;
		}


		audio.muted =
			true;


		audio.volume =
			0;


		let playAttempt;


		try {
			playAttempt =
				audio.play();

		} catch (error) {
			return;
		}


		function finishUnlock() {
			unlocked =
				true;


			audio.muted =
				false;


			fadeToVolume(
				MUSIC_VOLUME
			);


			removeUnlockListeners();
		}


		if (
			playAttempt &&
			typeof playAttempt.then ===
				"function"
		) {
			playAttempt
				.then(
					finishUnlock
				)
				.catch(
					() => {
						/*
							Keep listeners active.

							The next interaction
							can try again.
						*/
					}
				);

		} else {
			finishUnlock();
		}
	}


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
					unlockInGesture,
					true
				);
			}
		);
	}


	unlockEvents.forEach(
		eventName => {
			document.addEventListener(
				eventName,
				unlockInGesture,
				{
					capture: true,
					passive: true
				}
			);
		}
	);


	/* =====================================================
	   Resume helper
	   ===================================================== */

	function safePlay() {
		if (
			tabHidden ||
			playLock ||
			!unlocked ||
			!audio.paused
		) {
			return;
		}


		playLock =
			true;


		let playAttempt;


		try {
			playAttempt =
				audio.play();

		} catch (error) {
			playLock =
				false;

			return;
		}


		const release =
			() => {
				playLock =
					false;
			};


		if (
			playAttempt &&
			typeof playAttempt.then ===
				"function"
		) {
			playAttempt
				.then(
					release
				)
				.catch(
					release
				);

		} else {
			release();
		}
	}


	/* =====================================================
	   Pause when tab is hidden
	   ===================================================== */

	document.addEventListener(
		"visibilitychange",
		() => {
			tabHidden =
				document.hidden;


			if (
				tabHidden
			) {
				audio.pause();

			} else {
				safePlay();
			}
		}
	);


	/* =====================================================
	   iPhone Safari restore
	   ===================================================== */

	window.addEventListener(
		"pageshow",
		() => {
			tabHidden =
				document.hidden;


			if (
				!tabHidden
			) {
				safePlay();
			}
		}
	);


	/* =====================================================
	   Resume when returning to window
	   ===================================================== */

	window.addEventListener(
		"focus",
		() => {
			if (
				!tabHidden
			) {
				safePlay();
			}
		}
	);


	/* =====================================================
	   Recover if audio ends
	   ===================================================== */

	audio.addEventListener(
		"ended",
		() => {
			if (
				!tabHidden &&
				unlocked
			) {
				try {
					audio.currentTime =
						0;

				} catch (error) {
					/*
						Ignore.
					*/
				}


				safePlay();
			}
		}
	);


	/* =====================================================
	   Never allow volume above 10 percent
	   ===================================================== */

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


	/* =====================================================
	   Error
	   ===================================================== */

	audio.addEventListener(
		"error",
		() => {
			console.error(
				"Background music could not be loaded. Check audio.mp3."
			);
		}
	);


	/* =====================================================
	   Start
	   ===================================================== */

	tryAudibleAutoplay();
}
