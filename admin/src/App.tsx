import { Routes, Route, Navigate } from "react-router";
import { Suspense, lazy } from "react";
import LoadingScreen from "./components/shared/LoadingScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const Layout = lazy(() => import('./components/shared/Layout'))
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const ResortDashboardPage = lazy(() => import("./pages/dashboard/ResortDashboardPage"));
const TentDashboardPage = lazy(() => import("./pages/dashboard/TentDashboardPage"));
const TouristSpotDashboardPage = lazy(() => import("./pages/dashboard/TouristSpotDashboardPage"));

const VanaReportPage = lazy(() => import("./pages/DailyOccupancyReport/VanaVihariReport"));
const JunglestarReportPage = lazy(() => import("./pages/DailyOccupancyReport/JungleStarReport"));
const CheckInPage = lazy(() => import("./pages/frontdesk/CheckIn"));
const CheckOutPage = lazy(() => import("./pages/frontdesk/CheckOut"));
const AddRoomPage = lazy(() => import("./pages/rooms/AddRoomPage"));
const AllRoomsPage = lazy(() => import("./pages/rooms/AllRoomsPage"));
const AddGuestPage = lazy(() => import("./pages/guests/AddGuestPage"));
const AllGuestsPage = lazy(() => import("./pages/guests/AllGuestsPage"));
const AddResortsPage = lazy(() => import("./pages/resorts/AddResortsPage"));
const AllResortsPage = lazy(() => import("./pages/resorts/AllResortsPage"));

const AddTentTypes = lazy(() => import("./pages/tentTypes/AddTentTypes"));
const AllTentTypes = lazy(() => import("./pages/tentTypes/AllTentTypes"));

const AddTentSpots = lazy(() => import("./pages/TentSpots/AddTentSpots"));
const AllTentSpots = lazy(() => import("./pages/TentSpots/AllTentSpots"));

const AllLogReportsPage = lazy(
  () => import("./pages/logReports/AllLogReportsPage")
);
const LogTablePage = lazy(() => import("./pages/logReports/LogTablePage"));
const AddReservationPage = lazy(
  () => import("./pages/reservation/AddReservationPage")
);
const AllReservationPage = lazy(
  () => import("./pages/reservation/AllReservationPage")
);
const AllCottageTypePage = lazy(
  () => import("./pages/cottageTypes/AllCottageTypePage")
);
const AddCottageTypePage = lazy(
  () => import("./pages/cottageTypes/AddCottageTypePage")
);
const AllRoomAmenitiesPage = lazy(
  () => import("./pages/roomAmenities/AllRoomAmenitiesPage")
);
const AddRoomAmenitiesPage = lazy(
  () => import("./pages/roomAmenities/AddRoomAmenitiesPage")
);

const AddTouristSpot = lazy(() => import("./pages/TouristSpot/AddTouristSpot"));
const AllTouristSpot = lazy(() => import("./pages/TouristSpot/AllTouristSpot"));

const AllTentBook = lazy(() => import("./pages/tentBookings/AllTentBookings"));
const AddTentBook = lazy(() => import("./pages/tentBookings/AddTentBookings"));

const AllTouristBookingsPage = lazy(() => import("./pages/touristBookings/AllTouristBookingsPage"));
const AddTouristBookingPage = lazy(() => import("./pages/touristBookings/AddTouristBookingPage"));

const AddTents = lazy(() => import("./pages/tentInventory/AddTents"));
const AllTents = lazy(() => import("./pages/tentInventory/AllTents"));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard/report" replace />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard/report" element={<ResortDashboardPage />} />
          <Route path="tent/dashboard" element={<TentDashboardPage />} />
          <Route path="tourist/dashboard" element={<TouristSpotDashboardPage />} />
          <Route path="dailyoccupanyreport/vanavihari" element={<VanaReportPage/>} />
          <Route path="dailyoccupanyreport/junglestar" element={<JunglestarReportPage/>} />
          <Route path="frontdesk/checkin" element={<CheckInPage/>} />
          <Route path="frontdesk/checkout" element={<CheckOutPage/>} />
          <Route path="rooms/add" element={<AddRoomPage />} />
          <Route path="rooms/all" element={<AllRoomsPage/>} />
          <Route path="guests/add" element={<AddGuestPage />} />
          <Route path="guests/all" element={<AllGuestsPage />} />
          <Route path="resorts/add" element={<AddResortsPage />} />
          <Route path="resorts/all" element={<AllResortsPage />} />
          <Route path="log-reports/all" element={<AllLogReportsPage />} />
          <Route path="log-reports/table" element={<LogTablePage />} />
          <Route path="reservation/add" element={<AddReservationPage />} />
          <Route path="reservation/all" element={<AllReservationPage />} />
          <Route path="cottage-types/all" element={<AllCottageTypePage />} />
          <Route path="cottage-types/add" element={<AddCottageTypePage />} />
          <Route path="room-amenities/all" element={<AllRoomAmenitiesPage />} />
          <Route path="room-amenities/add" element={<AddRoomAmenitiesPage />} />
          <Route path="touristspots/add" element={<AddTouristSpot />} />
          <Route path="touristspots/all" element={<AllTouristSpot />} />
          <Route path="tenttypes/add" element={<AddTentTypes />} />
          <Route path="tenttypes/all" element={<AllTentTypes />} />
          <Route path="tentspots/add" element={<AddTentSpots />} />
          <Route path="tentspots/all" element={<AllTentSpots />} />
          <Route path="tentspots/details" element={<AddTentSpots />} />
          <Route path="tentbookings/allbookings" element={<AllTentBook />} />
          <Route path="tentbookings/addbookings" element={<AddTentBook />} />
          <Route path="tourist/bookings" element={<AllTouristBookingsPage />} />
          <Route path="tourist/bookings/add" element={<AddTouristBookingPage />} />
          <Route path="reports/daily-occupancy-junglestar" element={<JunglestarReportPage />} />
          <Route path="reports/daily-occupancy-vanavihari" element={<VanaReportPage />} />
          <Route path="tentinventory/addtents" element={<AddTents />} />
          <Route path="tentinventory/alltents" element={<AllTents />} />

        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
