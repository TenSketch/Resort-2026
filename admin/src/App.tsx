import { Routes, Route, Navigate } from "react-router";
import { Suspense, lazy } from "react";
import LoadingScreen from "./components/shared/LoadingScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

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
const UserManagementPage = lazy(() => import("./pages/users/UserManagementPage"));
const MyAccountPage = lazy(() => import("./pages/account/MyAccountPage"));

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
          <Route path="dailyoccupanyreport/vanavihari" element={<VanaReportPage />} />
          <Route path="dailyoccupanyreport/junglestar" element={<JunglestarReportPage />} />
          <Route path="frontdesk/checkin" element={<RoleGuard pageId="frontdesk"><CheckInPage /></RoleGuard>} />
          <Route path="frontdesk/checkout" element={<RoleGuard pageId="frontdesk"><CheckOutPage /></RoleGuard>} />
          <Route path="rooms/add" element={<RoleGuard pageId="rooms-add"><AddRoomPage /></RoleGuard>} />
          <Route path="rooms/all" element={<RoleGuard pageId="rooms-view"><AllRoomsPage /></RoleGuard>} />
          <Route path="guests/add" element={<RoleGuard pageId="guests-add"><AddGuestPage /></RoleGuard>} />
          <Route path="guests/all" element={<RoleGuard pageId="guests-view"><AllGuestsPage /></RoleGuard>} />
          <Route path="resorts/add" element={<RoleGuard pageId="resorts-add"><AddResortsPage /></RoleGuard>} />
          <Route path="resorts/all" element={<RoleGuard pageId="resorts-view"><AllResortsPage /></RoleGuard>} />
          <Route path="log-reports/all" element={<AllLogReportsPage />} />
          <Route path="log-reports/table" element={<LogTablePage />} />
          <Route path="reservation/add" element={<RoleGuard pageId="reservations-add"><AddReservationPage /></RoleGuard>} />
          <Route path="reservation/all" element={<RoleGuard pageId="reservations-view"><AllReservationPage /></RoleGuard>} />
          <Route path="cottage-types/all" element={<RoleGuard pageId="cottage-types-view"><AllCottageTypePage /></RoleGuard>} />
          <Route path="cottage-types/add" element={<RoleGuard pageId="cottage-types-add"><AddCottageTypePage /></RoleGuard>} />
          <Route path="room-amenities/all" element={<RoleGuard pageId="room-amenities-view"><AllRoomAmenitiesPage /></RoleGuard>} />
          <Route path="room-amenities/add" element={<RoleGuard pageId="room-amenities-add"><AddRoomAmenitiesPage /></RoleGuard>} />
          <Route path="touristspots/add" element={<RoleGuard pageId="tourist-spots-add"><AddTouristSpot /></RoleGuard>} />
          <Route path="touristspots/all" element={<RoleGuard pageId="tourist-spots-view"><AllTouristSpot /></RoleGuard>} />
          <Route path="tenttypes/add" element={<RoleGuard pageId="tent-types-add"><AddTentTypes /></RoleGuard>} />
          <Route path="tenttypes/all" element={<RoleGuard pageId="tent-types-view"><AllTentTypes /></RoleGuard>} />
          <Route path="tentspots/add" element={<RoleGuard pageId="tent-spots-add"><AddTentSpots /></RoleGuard>} />
          <Route path="tentspots/all" element={<RoleGuard pageId="tent-spots-view"><AllTentSpots /></RoleGuard>} />
          <Route path="tentspots/details" element={<RoleGuard pageId="tent-spots-view"><AddTentSpots /></RoleGuard>} />
          <Route path="tentbookings/allbookings" element={<RoleGuard pageId="tent-bookings-view"><AllTentBook /></RoleGuard>} />
          <Route path="tentbookings/addbookings" element={<RoleGuard pageId="tent-bookings-add"><AddTentBook /></RoleGuard>} />
          <Route path="tourist/bookings" element={<RoleGuard pageId="tourist-bookings-view"><AllTouristBookingsPage /></RoleGuard>} />
          <Route path="tourist/bookings/add" element={<RoleGuard pageId="tourist-bookings-add"><AddTouristBookingPage /></RoleGuard>} />
          <Route path="reports/daily-occupancy-junglestar" element={<JunglestarReportPage />} />
          <Route path="reports/daily-occupancy-vanavihari" element={<VanaReportPage />} />
          <Route path="tentinventory/addtents" element={<RoleGuard pageId="tent-inventory-add"><AddTents /></RoleGuard>} />
          <Route path="tentinventory/alltents" element={<RoleGuard pageId="tent-inventory-view"><AllTents /></RoleGuard>} />
          <Route path="users/manage" element={<RoleGuard pageId="user-management"><UserManagementPage /></RoleGuard>} />
          <Route path="my-account" element={<MyAccountPage />} />

        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
