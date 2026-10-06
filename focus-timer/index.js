import "./component.css";
// src/renderer/builtins/focus-timer/index.tsx
import { useCallback, useEffect, useState } from "react";
import { jsxDEV } from "react/jsx-dev-runtime";
function FocusTimer({ props, host }) {
  const focusMinutes = typeof props.focusMinutes === "number" ? props.focusMinutes : 25;
  const breakMinutes = typeof props.breakMinutes === "number" ? props.breakMinutes : 5;
  return /* @__PURE__ */ jsxDEV(Timer, {
    host,
    title: typeof props.title === "string" ? props.title : "One thing at a time",
    focusMinutes,
    breakMinutes
  }, `${focusMinutes}:${breakMinutes}`, false, undefined, this);
}
function Timer({ title, focusMinutes, breakMinutes, host }) {
  const [phase, setPhase] = useState("focus");
  const duration = (phase === "focus" ? focusMinutes : breakMinutes) * 60000;
  const [remaining, setRemaining] = useState(focusMinutes * 60000);
  const [deadline, setDeadline] = useState(null);
  const [completed, setCompleted] = useState(0);
  const finished = remaining === 0;
  useEffect(() => {
    if (deadline === null)
      return;
    const tick = () => {
      const next2 = Math.max(0, deadline - Date.now());
      setRemaining(next2);
      if (next2 === 0)
        setDeadline(null);
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline]);
  const seconds = Math.ceil(remaining / 1000);
  const label = finished ? phase === "focus" ? "Focus complete. Take a breath." : "Break complete. Ready when you are." : deadline !== null ? phase === "focus" ? "Make room for your next good idea." : "Step away. Stretch. Look outside." : remaining < duration ? "Paused. Pick up when you’re ready." : "A little space for meaningful work.";
  const toggle = useCallback(() => {
    if (deadline !== null) {
      setRemaining(Math.max(0, deadline - Date.now()));
      setDeadline(null);
    } else
      setDeadline(Date.now() + remaining);
  }, [deadline, remaining]);
  const next = useCallback(() => {
    if (phase === "focus")
      setCompleted((count) => count + 1);
    const nextPhase = phase === "focus" ? "break" : "focus";
    const nextDuration = (nextPhase === "focus" ? focusMinutes : breakMinutes) * 60000;
    setPhase(nextPhase);
    setRemaining(nextDuration);
    setDeadline(Date.now() + nextDuration);
  }, [phase, focusMinutes, breakMinutes]);
  const reset = useCallback(() => {
    setDeadline(null);
    setRemaining(duration);
  }, [duration]);
  useEffect(() => {
    const unregister = [
      host.actions.register({ id: "start", label: "Start or resume timer", enabled: deadline === null && !finished, disabledReason: finished ? "Start the next session after completion." : "Timer is already running.", run: toggle }),
      host.actions.register({ id: "pause", label: "Pause timer", enabled: deadline !== null, disabledReason: "Timer is not running.", run: toggle }),
      host.actions.register({ id: "reset", label: "Reset timer", enabled: remaining !== duration || deadline !== null, disabledReason: "Timer is already reset.", run: reset }),
      host.actions.register({ id: "next", label: "Start next timer session", enabled: finished, disabledReason: "Finish the current session first.", run: next })
    ];
    return () => unregister.forEach((remove) => remove());
  }, [host.actions, deadline, finished, remaining, duration, phase, focusMinutes, breakMinutes, toggle, next, reset]);
  return /* @__PURE__ */ jsxDEV("section", {
    className: "focus-timer",
    "aria-label": "Focus timer",
    "data-phase": phase,
    children: [
      /* @__PURE__ */ jsxDEV("div", {
        className: "focus-timer__eyebrow",
        children: [
          /* @__PURE__ */ jsxDEV("span", {
            className: "focus-timer__dot"
          }, undefined, false, undefined, this),
          phase === "focus" ? "FOCUS SESSION" : "ROOM TO BREATHE",
          /* @__PURE__ */ jsxDEV("span", {
            children: [
              focusMinutes,
              " / ",
              breakMinutes
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV("h2", {
        children: title
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("div", {
        className: "focus-timer__dial",
        children: [
          /* @__PURE__ */ jsxDEV("svg", {
            viewBox: "0 0 200 200",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxDEV("circle", {
                className: "focus-timer__track",
                cx: "100",
                cy: "100",
                r: "90"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("circle", {
                className: "focus-timer__progress",
                cx: "100",
                cy: "100",
                r: "90",
                pathLength: "100",
                strokeDasharray: "100",
                strokeDashoffset: 100 * (1 - remaining / duration)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV("div", {
            children: [
              /* @__PURE__ */ jsxDEV("span", {
                className: "focus-timer__time",
                role: "timer",
                "aria-label": `${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds remaining`,
                children: [
                  String(Math.floor(seconds / 60)).padStart(2, "0"),
                  ":",
                  String(seconds % 60).padStart(2, "0")
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV("span", {
                className: "focus-timer__phase",
                children: finished ? "COMPLETE" : phase === "focus" ? "STAY WITH IT" : "TAKE IT EASY"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV("p", {
        className: "focus-timer__message",
        role: "status",
        children: label
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("div", {
        className: "focus-timer__controls",
        children: [
          finished ? /* @__PURE__ */ jsxDEV("button", {
            type: "button",
            onClick: next,
            children: [
              "Start ",
              phase === "focus" ? "break" : "focus"
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV("button", {
            type: "button",
            onClick: toggle,
            children: deadline !== null ? "Pause" : remaining < duration ? "Resume" : `Start ${phase}`
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("button", {
            type: "button",
            className: "focus-timer__reset",
            disabled: remaining === duration && deadline === null,
            onClick: reset,
            children: "Reset"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV("footer", {
        children: [
          /* @__PURE__ */ jsxDEV("span", {
            children: [
              completed + (finished && phase === "focus" ? 1 : 0),
              " focus sessions completed"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV("span", {
            children: "Resets when dashboard closes"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
export {
  FocusTimer as default
};
