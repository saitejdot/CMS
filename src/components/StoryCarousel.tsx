"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  memo,
} from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BannerItem {
  src: string;
  type: "image" | "video";
}

interface BannerPayload {
  desktop: BannerItem[];
  mobile: BannerItem[];
}

interface CarouselState {
  allStories: BannerPayload;
  deviceType: "desktop" | "mobile" | null;
  stories: BannerItem[];
  current: number;
  /** Monotonically increasing key — used to restart the progress animation */
  progressKey: number;
  transitioning: boolean;
  /** Direction of slide: 1 = forward, -1 = backward */
  direction: 1 | -1;
  loaded: boolean;
}

type CarouselAction =
  | { type: "LOAD"; payload: BannerPayload }
  | { type: "SET_DEVICE"; deviceType: "desktop" | "mobile" }
  | { type: "GOTO"; index: number; direction: 1 | -1 }
  | { type: "TRANSITION_DONE" }
  | { type: "RESET" };

const SLIDE_DURATION = 500; // ms
const IMAGE_DURATION = 5000; // ms

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────
function reducer(state: CarouselState, action: CarouselAction): CarouselState {
  switch (action.type) {
    case "LOAD": {
      const stories = state.deviceType ? action.payload[state.deviceType] : [];
      return {
        ...state,
        allStories: action.payload,
        stories,
        current: 0,
        progressKey: 0,
        transitioning: false,
        loaded: true,
      };
    }

    case "SET_DEVICE": {
      if (state.deviceType === action.deviceType) return state;
      const stories = state.allStories[action.deviceType] || [];
      return {
        ...state,
        deviceType: action.deviceType,
        stories,
        current: 0,
        progressKey: state.progressKey + 1,
        transitioning: false,
      };
    }

    case "GOTO":
      if (state.transitioning || state.stories.length === 0) return state;
      return {
        ...state,
        transitioning: true,
        direction: action.direction,
        // Store next index but don't apply yet — apply after transition
        current: action.index,
        progressKey: state.progressKey + 1,
      };

    case "TRANSITION_DONE":
      return { ...state, transitioning: false };

    case "RESET":
      return {
        ...state,
        current: 0,
        progressKey: state.progressKey + 1,
        transitioning: false,
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Lazy media item (only renders when near active)
// ─────────────────────────────────────────────
interface MediaItemProps {
  story: BannerItem;
  index: number;
  active: boolean;
  onEnded: () => void;
}

const MediaItem = memo(function MediaItem({
  story,
  index,
  active,
  onEnded,
}: MediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // When this story becomes active, play the video from the start
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (active) {
      vid.currentTime = 0;
      vid.play().catch(() => {
        /* autoplay blocked — silently ignored */
      });
    } else {
      vid.pause();
    }
  }, [active]);

  if (story.type === "video") {
    return (
      <video
        ref={videoRef}
        src={story.src}
        muted
        playsInline
        preload="none"
        onEnded={onEnded}
        aria-label={`Story video ${index + 1}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={story.src}
      alt={`Story ${index + 1}`}
      loading="lazy"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
});

// ─────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────
interface ProgressBarProps {
  total: number;
  current: number;
  progressKey: number;
  duration: number; // ms — active segment fill duration
}

const ProgressBar = memo(function ProgressBar({
  total,
  current,
  progressKey,
  duration,
}: ProgressBarProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 8,
        left: 10,
        right: 10,
        display: "flex",
        gap: 4,
        zIndex: 10,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.3)",
            overflow: "hidden",
          }}
        >
          <div
            key={i < current ? `done-${i}` : i === current ? `active-${progressKey}` : `empty-${i}`}
            className={
              i < current
                ? "story-segment-done"
                : i === current
                ? "story-segment-active"
                : "story-segment-empty"
            }
            style={
              i === current
                ? ({ "--story-duration": `${duration}ms` } as React.CSSProperties)
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
});

// ─────────────────────────────────────────────
// Main StoryCarousel
// ─────────────────────────────────────────────
export default function StoryCarousel() {
  const [state, dispatch] = useReducer(reducer, {
    allStories: { desktop: [], mobile: [] },
    deviceType: null, // null during SSR
    stories: [],
    current: 0,
    progressKey: 0,
    transitioning: false,
    direction: 1,
    loaded: false,
  });

  const { stories, current, progressKey, transitioning, loaded, deviceType } = state;
  const total = stories.length;

  // ── Fetch banner list ──────────────────────
  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data: BannerPayload) => {
        dispatch({ type: "LOAD", payload: data });
      })
      .catch(() => dispatch({ type: "LOAD", payload: { desktop: [], mobile: [] } }));
  }, []);

  // ── Match Media (Device Detection) ─────────
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");

    const updateDevice = (e: MediaQueryListEvent | MediaQueryList) => {
      dispatch({
        type: "SET_DEVICE",
        deviceType: e.matches ? "desktop" : "mobile",
      });
    };

    updateDevice(mql);

    // Some older browsers use addListener instead of addEventListener
    if (mql.addEventListener) {
      mql.addEventListener("change", updateDevice);
      return () => mql.removeEventListener("change", updateDevice);
    } else {
      mql.addListener(updateDevice);
      return () => mql.removeListener(updateDevice);
    }
  }, []);

  // ── Auto-advance timer (images/gifs only) ──
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(
    (dir: 1 | -1 = 1) => {
      if (total === 0) return;
      const next = ((current + dir) % total + total) % total;
      dispatch({ type: "GOTO", index: next, direction: dir });
    },
    [current, total]
  );

  const startOver = useCallback(() => {
    clearTimer();
    dispatch({ type: "RESET" });
  }, [clearTimer]);

  // Reset transition flag after slide animation
  useEffect(() => {
    if (!transitioning) return;
    const t = setTimeout(() => {
      dispatch({ type: "TRANSITION_DONE" });
    }, SLIDE_DURATION);
    return () => clearTimeout(t);
  }, [transitioning, current]);

  // Start auto-advance timer for image/gif stories
  useEffect(() => {
    if (!loaded || total === 0 || transitioning || !deviceType) return;
    const currentStory = stories[current];
    if (!currentStory || currentStory.type === "video") return;

    clearTimer();
    timerRef.current = setTimeout(() => {
      advance(1);
    }, IMAGE_DURATION);

    return clearTimer;
  }, [loaded, current, progressKey, transitioning, total, stories, advance, clearTimer, deviceType]);

  // ── Keyboard navigation ────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft") advance(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  // ── Touch / swipe ──────────────────────────
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      touchStartX.current = null;
      if (Math.abs(delta) < 50) return; // threshold
      advance(delta > 0 ? 1 : -1);
    },
    [advance]
  );

  // ── Compute render window (current ± 1) ───
  // We render only prev, current, next to keep DOM light for 100 stories
  const renderIndices = new Set<number>();
  if (total > 0) {
    renderIndices.add(current);
    renderIndices.add(((current - 1) % total + total) % total);
    renderIndices.add((current + 1) % total);
  }

  // Duration for active segment progress fill
  const activeDuration =
    loaded && total > 0 && stories[current]?.type === "video"
      ? 0 // video duration unknown — bar stays empty until video ends
      : IMAGE_DURATION;

  // ── Empty / loading state ─────────────────
  // Prevent hydration mismatch by returning a skeleton if we don't know the device type yet
  if (!loaded || !deviceType) {
    return (
      <div
        className="story-carousel-shell"
        aria-hidden="true"
        style={{ background: "var(--card)", borderRadius: 12 }}
      />
    );
  }

  if (total === 0) {
    return (
      <div
        className="story-carousel-shell"
        aria-hidden="true"
        style={{ background: "var(--card)", borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
      >
        No {deviceType} banners found. Add numbered media files to /public/banners/{deviceType}
      </div>
    );
  }

  return (
    <div
      className="story-carousel-shell"
      role="region"
      aria-label="Story carousel"
      tabIndex={0}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ outline: "none" }}
    >
      {/* ── Progress bar ── */}
      <ProgressBar
        total={total}
        current={current}
        progressKey={progressKey}
        duration={activeDuration}
      />

      {/* ── Slide track ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: "inherit",
        }}
      >
        {stories.map((story, i) => {
          if (!renderIndices.has(i)) return null;

          const offset = i - current;
          // Wrap-around handling for seamless loop
          let adjustedOffset = offset;
          if (total > 1) {
            if (offset > total / 2) adjustedOffset = offset - total;
            if (offset < -total / 2) adjustedOffset = offset + total;
          }

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateX(${adjustedOffset * 100}%)`,
                transition: transitioning
                  ? `transform ${SLIDE_DURATION}ms ease-in-out`
                  : "none",
                willChange: "transform",
              }}
            >
              <MediaItem
                story={story}
                index={i}
                active={i === current}
                onEnded={() => advance(1)}
              />
            </div>
          );
        })}
      </div>

      {/* ── Nav buttons (hover-visible on desktop, always-visible on mobile) ── */}
      <div className="story-nav-overlay">
        <button
          className="story-nav-btn story-nav-prev"
          onClick={() => advance(-1)}
          aria-label="Previous story"
          tabIndex={0}
        >
          ‹
        </button>
        <button
          className="story-nav-btn story-nav-next"
          onClick={() => advance(1)}
          aria-label="Next story"
          tabIndex={0}
        >
          ›
        </button>
      </div>

      {/* ── Start Over ── */}
      <button
        className="story-start-over"
        onClick={startOver}
        aria-label="Start over from first story"
        tabIndex={0}
      >
        ↺ Start Over
      </button>
    </div>
  );
}
