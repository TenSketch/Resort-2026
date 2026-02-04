
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

// Required plugins
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol";

// Styles
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";

import { useState, useEffect } from "react";

DataTable.use(DT);

interface AmountCredited {
    id: string;
    month: string;
    date: string;
    resort?: string;
    orderId: string;
    name: string;
    totalCottages: number;
    extraPerson: number;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    days?: number;
    amountPaidByGuest?: number;
    paymentMode?: string;
    amount: number;
    totalReceivedInOneDay?: number;
    amountCredited: number;
}

interface AmountDebited {
    id: string;
    month: string;
    date: string;
    orderId: string;
    name: string;
    totalCottages: number;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    totalDays?: string;
    amountRefundedToGuest?: number;
    amountCreditedToVanaBankAcc?: number;
    amount?: number;
    total?: number;
    amountDebited?: number;
    amountCredited?: number;
}

const VanavihariConsolidationReport = () => {
    const [creditedData, setCreditedData] = useState<AmountCredited[]>([]);
    const [debitedData, setDebitedData] = useState<AmountDebited[]>([]);

    // Fetch data from API or use sample data
    useEffect(() => {
        // TODO: Replace with actual API call
        // Sample dummy data for manual QA
        setCreditedData([
            {
                id: "1",
                month: "Feb-26",
                date: "2026-02-01",
                resort: "Vanavihari",
                orderId: "VN-1001",
                name: "Asha Kumar",
                totalCottages: 2,
                extraPerson: 1,
                checkIn: "2026-02-10",
                checkOut: "2026-02-12",
                nights: 2,
                days: 2,
                amountPaidByGuest: 12000,
                paymentMode: "Card",
                amount: 12000,
                totalReceivedInOneDay: 12000,
                amountCredited: 11000,
            },
            {
                id: "2",
                month: "Feb-26",
                date: "2026-02-02",
                resort: "Vanavihari",
                orderId: "VN-1002",
                name: "Rahul Singh",
                totalCottages: 1,
                extraPerson: 0,
                checkIn: "2026-02-15",
                checkOut: "2026-02-16",
                nights: 1,
                days: 1,
                amountPaidByGuest: 6000,
                paymentMode: "UPI",
                amount: 6000,
                totalReceivedInOneDay: 6000,
                amountCredited: 5500,
            },
            {
                id: "3",
                month: "Feb-26",
                date: "2026-02-05",
                resort: "Vanavihari",
                orderId: "VN-1003",
                name: "Priya Desai",
                totalCottages: 1,
                extraPerson: 2,
                checkIn: "2026-02-18",
                checkOut: "2026-02-21",
                nights: 3,
                days: 3,
                amountPaidByGuest: 18000,
                paymentMode: "Netbanking",
                amount: 18000,
                totalReceivedInOneDay: 18000,
                amountCredited: 17000,
            },
            {
                id: "4",
                month: "Feb-26",
                date: "2026-02-06",
                resort: "Vanavihari",
                orderId: "VN-1004",
                name: "Vikram Shah",
                totalCottages: 2,
                extraPerson: 0,
                checkIn: "2026-02-20",
                checkOut: "2026-02-22",
                nights: 2,
                days: 2,
                amountPaidByGuest: 15000,
                paymentMode: "Card",
                amount: 15000,
                totalReceivedInOneDay: 15000,
                amountCredited: 14000,
            },
            {
                id: "5",
                month: "Feb-26",
                date: "2026-02-07",
                resort: "Vanavihari",
                orderId: "VN-1005",
                name: "Leena Kapoor",
                totalCottages: 1,
                extraPerson: 1,
                checkIn: "2026-02-28",
                checkOut: "2026-03-01",
                nights: 1,
                days: 1,
                amountPaidByGuest: 7000,
                paymentMode: "Cash",
                amount: 7000,
                totalReceivedInOneDay: 7000,
                amountCredited: 6500,
            },
            {
                id: "6",
                month: "Mar-26",
                date: "2026-03-02",
                resort: "Vanavihari",
                orderId: "VN-1006",
                name: "Arjun Mehta",
                totalCottages: 3,
                extraPerson: 1,
                checkIn: "2026-03-10",
                checkOut: "2026-03-13",
                nights: 3,
                days: 3,
                amountPaidByGuest: 27000,
                paymentMode: "Card",
                amount: 27000,
                totalReceivedInOneDay: 27000,
                amountCredited: 26000,
            },
            {
                id: "7",
                month: "Mar-26",
                date: "2026-03-03",
                resort: "Vanavihari",
                orderId: "VN-1007",
                name: "Nina Grover",
                totalCottages: 1,
                extraPerson: 0,
                checkIn: "2026-03-15",
                checkOut: "2026-03-16",
                nights: 1,
                days: 1,
                amountPaidByGuest: 5000,
                paymentMode: "UPI",
                amount: 5000,
                totalReceivedInOneDay: 5000,
                amountCredited: 4800,
            },
        ]);

        setDebitedData([
            {
                id: "d1",
                month: "Feb-26",
                date: "2026-02-03",
                orderId: "VN-2001",
                name: "Sonia Patel",
                totalCottages: 1,
                checkIn: "2026-02-20",
                checkOut: "2026-02-22",
                nights: 2,
                totalDays: "2",
                amountRefundedToGuest: 3000,
                amountCreditedToVanaBankAcc: 0,
            },
            {
                id: "d2",
                month: "Feb-26",
                date: "2026-02-04",
                orderId: "VN-2002",
                name: "Manish Rao",
                totalCottages: 3,
                checkIn: "2026-02-25",
                checkOut: "2026-02-27",
                nights: 2,
                totalDays: "2",
                amountRefundedToGuest: 9000,
                amountCreditedToVanaBankAcc: 0,
            },
            {
                id: "d3",
                month: "Mar-26",
                date: "2026-03-05",
                orderId: "VN-2003",
                name: "Kavita Reddy",
                totalCottages: 2,
                checkIn: "2026-03-10",
                checkOut: "2026-03-12",
                nights: 2,
                totalDays: "2",
                amountRefundedToGuest: 6000,
                amountCreditedToVanaBankAcc: 0,
            },
            {
                id: "d4",
                month: "Mar-26",
                date: "2026-03-06",
                orderId: "VN-2004",
                name: "Ramesh Kumar",
                totalCottages: 1,
                checkIn: "2026-03-15",
                checkOut: "2026-03-16",
                nights: 1,
                totalDays: "1",
                amountRefundedToGuest: 2500,
                amountCreditedToVanaBankAcc: 0,
            },
            {
                id: "d5",
                month: "Mar-26",
                date: "2026-03-07",
                orderId: "VN-2005",
                name: "Geeta Sharma",
                totalCottages: 2,
                checkIn: "2026-03-20",
                checkOut: "2026-03-22",
                nights: 2,
                totalDays: "2",
                amountRefundedToGuest: 8000,
                amountCreditedToVanaBankAcc: 0,
            },
        ]);
    }, []);

    const creditedColumns = [
        { title: "<strong>MMM-YY</strong>", data: "month" },
        { title: "<strong>Reservation Date</strong>", data: "date" },
        { title: "<strong>Resort</strong>", data: "resort" },
        { title: "<strong>Booking ID</strong>", data: "orderId" },
        { title: "<strong>GUEST NAME</strong>", data: "name" },
        { title: "<strong>TOTAL ROOMS</strong>", data: "totalCottages" },
        { title: "<strong>EXTRA GUESTS</strong>", data: "extraPerson" },
        { title: "<strong>CHECK-IN</strong>", data: "checkIn" },
        { title: "<strong>CHECK-OUT</strong>", data: "checkOut" },
        { title: "<strong>No. of Nights</strong>", data: "nights" },
        { title: "<strong>Days</strong>", data: "days" },
        {
            title: "<strong>Amt paid by guest</strong>",
            data: "amountPaidByGuest",
            render: (data: number) => data == null ? "" : `₹${data.toLocaleString('en-IN')}`,
        },
        { title: "<strong>Payment mode</strong>", data: "paymentMode" },
        {
            title: "<strong>AMOUNT</strong>",
            data: "amount",
            render: (data: number) => `₹${data.toLocaleString('en-IN')}`,
        },
        {
            title: "<strong>TOTAL received in one day</strong>",
            data: "totalReceivedInOneDay",
            render: (data: number) => data == null ? "" : `₹${data.toLocaleString('en-IN')}`,
        },
    ];

    const debitedColumns = [
        { title: "<strong>Booking ID</strong>", data: "orderId" },
        { title: "<strong>GUEST NAME</strong>", data: "name" },
        { title: "<strong>TOTAL Rooms</strong>", data: "totalCottages" },
        { title: "<strong>CHECK-IN</strong>", data: "checkIn" },
        { title: "<strong>CHECK-OUT</strong>", data: "checkOut" },
        { title: "<strong>No. of Nights</strong>", data: "nights" },
        { title: "<strong>Total days</strong>", data: "totalDays" },
        {
            title: "<strong>Amt refunded to guest</strong>",
            data: "amountRefundedToGuest",
            render: (data: number) => data == null ? "" : `₹${data.toLocaleString('en-IN')}`,
        },
        {
            title: "<strong>AMOUNT CREDITED TO VANA BANK ACC</strong>",
            data: "amountCreditedToVanaBankAcc",
            render: (data: number) => data == null ? "" : `₹${data.toLocaleString('en-IN')}`,
        },
    ];

    return (
        <div className="w-full max-w-full overflow-hidden p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Consolidation Report</h1>
            
            {/* Amount Credited Table */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Amount Credited</h2>
                <div className="w-full">
                    <DataTable
                        data={creditedData}
                        columns={creditedColumns}
                        className="display nowrap w-full border border-gray-400"
                        options={{
                            pageLength: 10,
                            lengthMenu: [5, 10, 25, 50, 100],
                            order: [[0, "asc"]],
                            searching: true,
                            paging: true,
                            info: true,
                            scrollX: true,
                            scrollCollapse: true,
                            scrollY: "400px",
                            layout: {
                                topStart: "buttons",
                                bottom1Start: "pageLength",
                            },
                            buttons: [
                                {
                                    extend: "colvis",
                                    text: "Column Visibility",
                                    collectionLayout: "fixed two-column",
                                },
                            ],
                            columnControl: ["order", ["orderAsc", "orderDesc", "spacer", "search"]],
                        }}
                    />
                </div>
            </div>

            {/* Amount Debited Table */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Amount Debited</h2>
                <div className="w-full">
                    <DataTable
                        data={debitedData}
                        columns={debitedColumns}
                        className="display nowrap w-full border border-gray-400"
                        options={{
                            pageLength: 10,
                            lengthMenu: [5, 10, 25, 50, 100],
                            order: [[0, "asc"]],
                            searching: true,
                            paging: true,
                            info: true,
                            scrollX: true,
                            scrollCollapse: true,
                            scrollY: "400px",
                            layout: {
                                topStart: "buttons",
                                bottom1Start: "pageLength",
                            },
                            buttons: [
                                {
                                    extend: "colvis",
                                    text: "Column Visibility",
                                    collectionLayout: "fixed two-column",
                                },
                            ],
                            columnControl: ["order", ["orderAsc", "orderDesc", "spacer", "search"]],
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default VanavihariConsolidationReport;