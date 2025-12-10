// // src/components/ProtectedRoute.tsx
// import React from "react";
// import { Navigate, Outlet } from "react-router-dom";

// const ProtectedRoute: React.FC = () => {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     // Niet ingelogd → redirect naar error page met 401
//     return (
//       <Navigate
//         to="/error"
//         replace
//         state={{ status: 401, message: "Je bent niet ingelogd. Log in om verder te gaan." }}
//       />
//     );
//   }

//   // Ingelogd → laat de child routes zien
//   return <Outlet />;
// };

// export default ProtectedRoute;
