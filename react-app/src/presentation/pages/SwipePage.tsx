import "../swipe.css";
import { useState } from "react";

/**
 * Simple swipe page with:
 * - empty swipe card
 * - drag left / right
 * - buttons (X, ?, heart)
 */
export default function SwipePage() {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const SWIPE_THRESHOLD = 120;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setStartX(e.clientX);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setX(e.clientX - startX);
  };

  const onPointerUp = () => {
    setDragging(false);

    if (x > SWIPE_THRESHOLD) {
      console.log("LIKE");
    } else if (x < -SWIPE_THRESHOLD) {
      console.log("DISLIKE");
    }

    setX(0);
  };

  const triggerSwipe = (direction: "left" | "right") => {
    console.log(direction === "right" ? "LIKE" : "DISLIKE");
    setX(0);
  };

  const openInfo = () => {
    alert(
      "Swipe right to like.\nSwipe left to dislike.\nYou can also use the buttons below."
    );
  };

  return (
    <div className="swipe-page">
      <div className="swipe-wrapper">
        {/* Swipe Card */}
        <div
          className="swipe-card"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(${x}px) rotate(${x / 10}deg)`,
            transition: dragging ? "none" : "transform 0.3s ease",
            touchAction: "none",
          }}
        />

        {/* Action buttons */}
        <div className="swipe-actions">
          <button
            className="swipe-btn brand"
            onClick={() => triggerSwipe("left")}
          >
            X
          </button>

          <button className="swipe-btn brand" onClick={openInfo}>
            ?
          </button>

          <button
            className="swipe-btn brand"
            onClick={() => triggerSwipe("right")}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
