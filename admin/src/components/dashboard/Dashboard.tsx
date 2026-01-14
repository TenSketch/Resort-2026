import { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BedDouble, Users, LogOut, CreditCard, TrendingUp} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip
} from "recharts";

import type { LucideIcon } from "lucide-react";

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A855F7", "#F87171"];
const LINE_COLOR = "#2563EB";

interface Resort {
  id: string;
  name: string;
  vacantToday: number;
}

interface Booking {
  id: string;
  guest: string;
  resort: string;
  room: string;
  status: string;
  amount: number;
}

interface PaymentData {
  name: string;
  value: number;
}

interface OccupancyData {
  day: string;
  occupancy: number;
}

interface DashboardData {
  stats: {
    totalBookingsToday: number;
    vacantRooms: number;
    totalGuestsToday: number;
    expectedCheckouts: number;
  };
  paymentBreakdown: PaymentData[];
  last5Bookings: Booking[];
  occupancy7Day: OccupancyData[];
  resorts: Resort[];
}



type StatCardProps = {
  title: string;
  value: string | number;
  Icon: LucideIcon;
  color?: string; // Tailwind class for icon color
};


const StatCard = ({ title, value, Icon, color = "text-blue-500" }: StatCardProps) => (
  <div className="p-4 border rounded-lg shadow-sm bg-white flex-1">
    <div className="flex items-center space-x-4">
      <Icon className={`w-6 h-6 ${color}`} />
      <div className="truncate">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        <p className="text-lg font-semibold truncate">{value}</p>
      </div>
    </div>
  </div>
);





export default function AdminDashboard() {
  const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
  const [selectedResort, setSelectedResort] = useState<string>('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const queryParam = selectedResort !== 'all' ? `?resortId=${selectedResort}` : '';
        const response = await fetch(`${apiUrl}/api/reports/dashboard${queryParam}`);
        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result);
        } else {
          console.error('Failed to fetch dashboard data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiUrl, selectedResort]);

  if (isLoading || !dashboardData) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats, paymentBreakdown, last5Bookings, occupancy7Day, resorts } = dashboardData;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of resort operations</p>
        </div>
        <Select value={selectedResort} onValueChange={setSelectedResort}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Select resort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resorts</SelectItem>
            {resorts.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          Icon={CalendarDays} 
          title="Total Bookings Today" 
          value={stats.totalBookingsToday} 
          color="text-green-500"
        />
        <StatCard
          Icon={BedDouble}
          title="Vacant Rooms"
          value={selectedResort === 'all' 
            ? stats.vacantRooms 
            : resorts.find(r => r.id === selectedResort)?.vacantToday ?? 0
          }
          color="text-purple-500"
        />
        <StatCard 
          Icon={Users} 
          title="Total Guests Today" 
          value={stats.totalGuestsToday} 
          color="text-orange-500"
        />
        <StatCard 
          Icon={LogOut} 
          title="Expected Checkouts" 
          value={stats.expectedCheckouts} 
          color="text-red-500" 
        />
      </div>

      {/* Payment + Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentBreakdown.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentBreakdown} dataKey="value" outerRadius={90} label>
                      {paymentBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="lg:col-span-2 overflow-x-auto">
          <CardHeader>
            <CardTitle>Last 5 Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {last5Bookings.length > 0 ? (
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Resort</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {last5Bookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{b.id}</TableCell>
                      <TableCell>{b.guest}</TableCell>
                      <TableCell>{b.resort}</TableCell>
                      <TableCell>{b.room}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "Paid" ? "secondary" : b.status === "Pending" ? "outline" : "destructive"}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{b.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No recent bookings
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> 7-Day Forecast Occupancy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancy7Day}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <ReTooltip formatter={(v) => `${v}%`} />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke={LINE_COLOR} 
                  strokeWidth={2} 
                  dot={{ fill: LINE_COLOR, r: 5 }} 
                  activeDot={{ r: 7 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
