import { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import PageLoader from "@/components/shared/PageLoader";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Users,
  IndianRupee,
  XCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip,
  BarChart, Bar, Legend
} from "recharts";
import type { LucideIcon } from "lucide-react";

interface TrekStat {
  todayBookings: number;
  todayGuests: number;
  todayRevenue: number;
  todayCancellations: number;
  upcomingCount: number;
}

interface TopTrek {
  name: string;
  bookings: number;
  guests: number;
  revenue: number;
}

interface UpcomingTrek {
  id: string;
  date: string;
  guestName: string;
  trekSpot: string;
  guests: number;
  amount: number;
  status: string;
}

interface MonthlySummary {
  totalBookings: number;
  totalGuests: number;
  totalRevenue: number;
}

interface DashboardData {
  stats: TrekStat;
  comparison: {
    bookings: number;
    cancellations: number;
    revenueToday: number;
    revenueYesterday: number;
  };
  topSpots: TopTrek[];
  bookingsByCategory: { name: string; value: number }[];
  upcomingBookings: UpcomingTrek[];
  monthlySummary: MonthlySummary;
}

const COLORS = ["#549D0A", "#8B4513", "#10B981", "#3B82F6", "#F59E0B"];

const RESORT_COLORS = {
  VANA: "#549D0A",
  JS: "#8B4513"
};

const StatCard = ({ title, value, footer, Icon }: { title: string, value: string | number, footer?: string, Icon: LucideIcon }) => {
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(to bottom, ${RESORT_COLORS.VANA} 50%, ${RESORT_COLORS.JS} 50%)` }} />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
      {footer !== undefined && (
        <div className="mt-3 text-xs text-gray-500">{footer}</div>
      )}
    </div>
  );
};

export default function TouristSpotDashboard() {
  const [data] = useState<DashboardData>({
    stats: {
      todayBookings: 0,
      todayGuests: 0,
      todayRevenue: 0,
      todayCancellations: 0,
      upcomingCount: 0
    },
    comparison: {
      bookings: 0,
      cancellations: 0,
      revenueToday: 0,
      revenueYesterday: 0
    },
    topSpots: [],
    bookingsByCategory: [],
    upcomingBookings: [],
    monthlySummary: {
      totalBookings: 0,
      totalGuests: 0,
      totalRevenue: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading to match other dashboards
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // adjust time as needed
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading trek dashboard..." />;
  }

  const { stats, comparison, topSpots, bookingsByCategory, upcomingBookings, monthlySummary } = data;

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Trek Dashboard</h1>
        <p className="text-gray-500">Today at a Glance – Trek Operations</p>
      </div>

      {/* Stats Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Bookings"
          value={stats.todayBookings}
          Icon={CalendarCheck}
        />
        <StatCard
          title="Today's Guests"
          value={stats.todayGuests}
          Icon={Users}
        />
        <StatCard
          title="Today's Revenue"
          value={`\u20B9${stats.todayRevenue.toLocaleString()}`}
          Icon={IndianRupee}
        />
        <StatCard
          title="Today's Cancellations"
          value={stats.todayCancellations}
          Icon={XCircle}
        />
        <StatCard
          title="Upcoming Treks (7D)"
          value={stats.upcomingCount}
          footer="Next 7 Days"
          Icon={Clock}
        />
      </div>

      {/* Comparison Charts (Row 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookings vs Cancellations (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Today', Bookings: comparison.bookings, Cancellations: comparison.cancellations }]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="Bookings" fill="#549D0A" />
                  <Bar dataKey="Cancellations" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Today vs Yesterday</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Yesterday', revenue: comparison.revenueYesterday },
                  { name: 'Today', revenue: comparison.revenueToday }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="revenue" fill={RESORT_COLORS.VANA}>
                    {[0, 1].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? RESORT_COLORS.JS : RESORT_COLORS.VANA} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trek Performance & Category (Row 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Performing Trek Spots (This Month)</CardTitle>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trek Name</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Guests</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSpots.map((spot, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{spot.name}</TableCell>
                    <TableCell className="text-right">{spot.bookings}</TableCell>
                    <TableCell className="text-right">{spot.guests}</TableCell>
                    <TableCell className="text-right">\u20B9{spot.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookings by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bookingsByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Section (Row 4) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Trek Bookings (Next 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead>Trek Spot</TableHead>
                <TableHead className="text-right">Guests</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{b.guestName}</TableCell>
                  <TableCell>{b.trekSpot}</TableCell>
                  <TableCell className="text-right">{b.guests}</TableCell>
                  <TableCell className="text-right">\u20B9{b.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={b.status === 'reserved' ? 'secondary' : b.status === 'pending' ? 'outline' : 'destructive'}
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {upcomingBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No upcoming bookings found for the next 7 days.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Summary Section (Row 5) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">This Month Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#549D0A]/5 border-[#549D0A]/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#549D0A]/10 rounded-lg text-[#549D0A]">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#549D0A]">Total Bookings</p>
                  <p className="text-2xl font-bold text-[#549D0A]">{monthlySummary.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#8B4513]/5 border-[#8B4513]/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#8B4513]/10 rounded-lg text-[#8B4513]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#8B4513]">Total Guests</p>
                  <p className="text-2xl font-bold text-[#8B4513]">{monthlySummary.totalGuests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Total Revenue</p>
                  <p className="text-2xl font-bold text-amber-900">\u20B9{monthlySummary.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}