// import { useRef, useState } from "react";

// interface VkmSwipeCardProps {
//   onSwipe: (direction: "left" | "right") => void;
// }

// export default function VkmSwipeCard({ onSwipe }: VkmSwipeCardProps) {
//   const cardRef = useRef<HTMLDivElement>(null);
//   const startX = useRef(0);
//   const [x, setX] = useState(0);
//   const [dragging, setDragging] = useState(false);

//   const SWIPE_THRESHOLD = 120;

//   const onPointerDown = (e: React.PointerEvent) => {
//     startX.current = e.clientX;
//     setDragging(true);
//     cardRef.current?.setPointerCapture(e.pointerId);
//   };

//   const onPointerMove = (e: React.PointerEvent) => {
//     if (!dragging) return;
//     setX(e.clientX - startX.current);
//   };

//   const onPointerUp = () => {
//     setDragging(false);

//     if (x > SWIPE_THRESHOLD) {
//       onSwipe("right");
//     } else if (x < -SWIPE_THRESHOLD) {
//       onSwipe("left");
//     }

//     setX(0);
//   };

//   return (
//     <div
//       ref={cardRef}
//       onPointerDown={onPointerDown}
//       onPointerMove={onPointerMove}
//       onPointerUp={onPointerUp}
//       onPointerCancel={onPointerUp}
//       style={{
//         transform: `translateX(${x}px) rotate(${x / 10}deg)`,
//         transition: dragging ? "none" : "transform 0.3s ease",
//         touchAction: "none",
//         cursor: "grab",
//       }}
//       className="swipe-card"
//     >
//       {/* lege kaart */}
//     </div>
//   );
// }
