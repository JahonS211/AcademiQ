"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Disable on mobile/touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    let animationFrame;
    const updateCursor = () => {
      // Smooth interpolation for modern trailing effect
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      }
      animationFrame = requestAnimationFrame(updateCursor);
    };

    const handleHover = (e) => {
      if (!cursorRef.current) return;
      const target = e.target;
      const isHoverable = 
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer");

      if (isHoverable) {
        cursorRef.current.classList.add("cursor-hover");
      } else {
        cursorRef.current.classList.remove("cursor-hover");
      }
    };

    const handleMouseDown = () => cursorRef.current?.classList.add("cursor-click");
    const handleMouseUp = () => cursorRef.current?.classList.remove("cursor-click");

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", handleHover, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    
    // Initial position to avoid flying from top-left
    document.addEventListener("mousemove", (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    }, { once: true });

    updateCursor();

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", handleHover);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  if (!mounted) return null;
  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return null;

  return (
    <>
      <style jsx global>{`
        body {
          cursor: none;
        }
        .modern-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          margin-left: -10px;
          margin-top: -10px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.4); /* Indigo semi-transparent */
          backdrop-filter: blur(2px);
          pointer-events: none;
          z-index: 99999;
          transition: width 0.3s ease, height 0.3s ease, background 0.3s ease, margin 0.3s ease;
          mix-blend-mode: exclusion;
        }
        .modern-cursor.cursor-hover {
          width: 50px;
          height: 50px;
          margin-left: -25px;
          margin-top: -25px;
          background: rgba(99, 102, 241, 0.2);
          mix-blend-mode: normal;
          border: 1px solid rgba(99, 102, 241, 0.5);
        }
        .modern-cursor.cursor-click {
          transform: scale(0.8) !important;
        }
        /* Make sure default cursors are hidden when using custom cursor */
        a, button, [role="button"], input, select, textarea {
          cursor: none !important;
        }
      `}</style>
      <div ref={cursorRef} className="modern-cursor hidden md:block" />
    </>
  );
}
