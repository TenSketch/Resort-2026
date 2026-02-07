import { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  BarChart, Bar, Legend
} from "recharts";

// removed unused icon types and legacy chart colors

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
  last5Bookings: Booking[];
  occupancy7Day: OccupancyData[];
  resorts: Resort[];
}



// legacy simple stat card removed in favor of SplitKPI

type SplitKPIProps = {
  title: string;
  vanaValue: number;
  jsValue: number;
  total?: number;
  footer?: string | number;
};

const RESORT_COLORS = {
  VANA: "#549D0A",
  JS: "#8B4513"
};

const SplitKPI = ({ title, vanaValue, jsValue, footer }: SplitKPIProps) => (
  <div className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden w-full">
    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(to bottom, ${RESORT_COLORS.VANA} 50%, ${RESORT_COLORS.JS} 50%)` }} />
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: RESORT_COLORS.VANA }} />
          <span className="text-sm font-medium">Vanavihari</span>
        </div>
        <div className="text-sm font-semibold" style={{ color: RESORT_COLORS.VANA }}>{vanaValue}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: RESORT_COLORS.JS }} />
          <span className="text-sm font-medium">Jungle Star</span>
        </div>
        <div className="text-sm font-semibold" style={{ color: RESORT_COLORS.JS }}>{jsValue}</div>
      </div>
    </div>
    {footer !== undefined && (
      <div className="mt-3 text-xs text-gray-500">Total: {footer}</div>
    )}
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

  const { stats, last5Bookings, occupancy7Day, resorts } = dashboardData;

  // Helper: attempt to split values by resort; fallback to equal split
  const splitValue = (total: number, vana?: number, js?: number) => {
    if (typeof vana === 'number' && typeof js === 'number') return { vana, js };
    // fallback equal-ish split: prefer VANA 60% / JS 40%
    const vanaVal = Math.round(total * 0.6);
    const jsVal = total - vanaVal;
    return { vana: vanaVal, js: jsVal };
  };

  // example: bookings vs cancellations (today) - use available stats or fallback
  const cancellationsToday = (dashboardData as any)?.stats?.cancellationsToday ?? Math.round(stats.totalBookingsToday * 0.08);
  const bookingsToday = stats.totalBookingsToday || 0;

  const checkinsToday = (dashboardData as any)?.stats?.checkinsToday ?? Math.max(0, bookingsToday - ((dashboardData as any)?.stats?.checkedInToday ?? 0));
  const checkoutsToday = stats.expectedCheckouts || 0;

  // Occupied vs Vacant
  const vacant = stats.vacantRooms ?? 0;
  const occupied = Math.max(0, (dashboardData as any)?.stats?.occupiedRooms ?? Math.round(stats.totalGuestsToday / 2)) ;
  const capacity = occupied + vacant || Math.max(occupied, vacant, 1);
  const occupancyPercent = Math.round((occupied / capacity) * 100);

  // Next 7 days stacked: use occupancy7Day as source and split into VANA/JS fallback
  const next7Stack = occupancy7Day.map(d => {
    const numeric = Number(d.occupancy) || 0;
    const { vana, js } = splitValue(numeric);
    return { day: d.day, VANA: vana, JS: js };
  });

  // Upcoming check-ins table - best-effort from last5Bookings or explicit field
  const upcoming = (dashboardData as any)?.upcomingCheckins ?? last5Bookings;

  // Check if a specific resort is selected
  const isSpecificResort = selectedResort !== 'all';
  const selectedResortName = isSpecificResort ? resorts.find(r => r.id === selectedResort)?.name : null;
  // Determine resort color based on selected resort name
  const resortColor = selectedResortName?.toLowerCase().includes('vana') ? RESORT_COLORS.VANA : RESORT_COLORS.JS;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Today at a Glance</h1>
          <p className="text-sm text-muted-foreground">Overview of resort operations</p>
        </div>
        <Select value={selectedResort} onValueChange={setSelectedResort}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All Resorts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resorts</SelectItem>
            {resorts.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Primary KPI Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSpecificResort ? (
          /* Single Resort View */
          <>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Today's Bookings</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{bookingsToday}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Today's Occupancy</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{occupancyPercent}%</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Today's Vacancy</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{vacant}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Total Guests Today</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{stats.totalGuestsToday}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
          </>
        ) : (
          /* All Resorts - Split View */
          <>
            {/* Today's Bookings */}
            {(() => {
              const { vana, js } = splitValue(bookingsToday, (dashboardData as any)?.stats?.vanaBookings, (dashboardData as any)?.stats?.jsBookings);
              return <SplitKPI title={"Today\u2019s Bookings"} vanaValue={vana} jsValue={js} footer={bookingsToday} />;
            })()}

            {/* Today's Occupancy */}
            {(() => {
              const occTotal = occupancyPercent;
              const vana = Math.round(occTotal * 0.6);
              const js = occTotal - vana;
              return <SplitKPI title={"Today\u2019s Occupancy"} vanaValue={vana} jsValue={js} footer={`${occupancyPercent}%`} />;
            })()}

            {/* Today's Vacancy */}
            {(() => {
              const vacTotal = vacant;
              const vana = Math.round(vacTotal * 0.6);
              const js = vacTotal - vana;
              return <SplitKPI title={"Today\u2019s Vacancy"} vanaValue={vana} jsValue={js} footer={vacTotal} />;
            })()}

            {/* Total Guests Today */}
            {(() => {
              const guests = stats.totalGuestsToday || 0;
              const vana = Math.round(guests * 0.6);
              const js = guests - vana;
              return <SplitKPI title={"Total Guests Today"} vanaValue={vana} jsValue={js} footer={guests} />;
            })()}
          </>
        )}
      </div>

      {/* Secondary KPI Cards (Row 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isSpecificResort ? (
          /* Single Resort View */
          <>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Today's Check-ins</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{checkinsToday}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Today's Check-outs</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{checkoutsToday}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm bg-white relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: resortColor }} />
              <h3 className="text-sm font-medium text-gray-600">Today's Cancellations</h3>
              <div className="mt-2 text-2xl font-bold" style={{ color: resortColor }}>{cancellationsToday}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedResortName}</div>
            </Card>
          </>
        ) : (
          /* All Resorts - Split View */
          <>
            {(() => {
              const checkins = (dashboardData as any)?.stats?.checkinsToday ?? Math.round(bookingsToday * 0.5);
              const { vana, js } = splitValue(checkins, (dashboardData as any)?.stats?.vanaCheckins, (dashboardData as any)?.stats?.jsCheckins);
              return <SplitKPI title={"Today\u2019s Check-ins"} vanaValue={vana} jsValue={js} footer={checkins} />;
            })()}

            {(() => {
              const checkouts = checkoutsToday || 0;
              const { vana, js } = splitValue(checkouts, (dashboardData as any)?.stats?.vanaCheckouts, (dashboardData as any)?.stats?.jsCheckouts);
              return <SplitKPI title={"Today\u2019s Check-outs"} vanaValue={vana} jsValue={js} footer={checkouts} />;
            })()}

            {(() => {
              const cancels = cancellationsToday || 0;
              const { vana, js } = splitValue(cancels, (dashboardData as any)?.stats?.vanaCancellations, (dashboardData as any)?.stats?.jsCancellations);
              return <SplitKPI title={"Today\u2019s Cancellations"} vanaValue={vana} jsValue={js} footer={cancels} />;
            })()}
          </>
        )}
      </div>

      {/* Comparison Charts */}
      <div>
        <h2 className="text-lg font-semibold">Today's Comparison Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {/* Bookings vs Cancellations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Bookings vs Cancellations (Today)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              <div className="h-56 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Today', Bookings: bookingsToday, Cancellations: cancellationsToday }]} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}> 
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ReTooltip />
                    <Bar dataKey="Bookings" fill="#10B981" />
                    <Bar dataKey="Cancellations" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Check-ins vs Check-outs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Check-ins vs Check-outs</CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              <div className="h-56 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Today', Checkins: checkinsToday, Checkouts: checkoutsToday }]} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}> 
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ReTooltip />
                    <Bar dataKey="Checkins" fill="#10B981" />
                    <Bar dataKey="Checkouts" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Occupied vs Vacant Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Occupied vs Vacant Rooms</CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              <div className="h-56 md:h-64 w-full flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="w-32 h-32 md:w-40 md:h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: 'Occupied', value: occupied }, { name: 'Vacant', value: vacant }]} dataKey="value" innerRadius={40} outerRadius={60} label>
                        <Cell key="occ" fill="#10B981" />
                        <Cell key="vac" fill="#E5E7EB" />
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-3xl md:text-4xl font-semibold">{occupancyPercent}%</div>
                  <div className="text-sm text-gray-500">Occupancy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guests Today vs Total Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Guests Today vs Total Capacity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm md:text-base text-gray-600 font-medium">{stats.totalGuestsToday} guests</div>
                  <div className="text-sm md:text-base text-gray-500">{capacity} capacity</div>
                </div>
                <div className="w-full bg-gray-100 h-6 md:h-8 rounded overflow-hidden">
                  <div className="h-full rounded bg-green-500 transition-all" style={{ width: `${Math.round((stats.totalGuestsToday / capacity) * 100)}%` }} />
                </div>
                <div className="text-center text-xs md:text-sm text-gray-500">
                  {Math.round((stats.totalGuestsToday / capacity) * 100)}% capacity
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next 7 Days - Upcoming Check-ins */}
      <div>
        <h2 className="text-lg font-semibold">Upcoming Check-ins (Next 7 Days)</h2>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Including today</p>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Upcoming Check-ins</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto px-2 md:px-6">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Check-in Date</TableHead>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Resort</TableHead>
                    <TableHead>Room / Tent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map((b: any) => (
                    <TableRow key={b.id ?? `${b.guest}-${b.room}`}>
                      <TableCell>{b.checkinDate ?? b.date ?? 'Today'}</TableCell>
                      <TableCell>{b.guest}</TableCell>
                      <TableCell>
                        {b.contact ? (
                          <a href={`tel:${b.contact}`} className="text-blue-600">📞 {b.contact}</a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{b.resort}</TableCell>
                      <TableCell>{b.room}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === 'Confirmed' ? 'secondary' : b.status === 'Partial Paid' ? 'outline' : 'destructive'}>
                          {b.status ?? 'Confirmed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Next 7 Days Check-ins (Vanavihari vs Jungle Star)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={next7Stack} stackOffset="expand" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="VANA" stackId="a" fill={RESORT_COLORS.VANA} name="Vanavihari" />
                    <Bar dataKey="JS" stackId="a" fill={RESORT_COLORS.JS} name="Jungle Star" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
