"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const XLSX = __importStar(require("xlsx"));
const express_1 = __importDefault(require("express"));
const helpers_1 = require("./helpers/helpers");
// import { ChallanByMonth, Condition, myType, PendingChallan, PendingChallanStats, RepeatOffender, TruckAverage, TruckChallan } from "./types/challan";
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
function importExcelData() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            yield prisma.challan.deleteMany();
            const workbook = XLSX.readFile("./data.xlsx"); // Replace with your Excel file
            const sheetName = workbook.SheetNames[2]; // Get first sheet
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            let count = 0;
            for (const entry of jsonData) {
                count++;
                console.log(count, "entry");
                yield prisma.challan.create({
                    data: {
                        rc_number: entry === null || entry === void 0 ? void 0 : entry.rc_number,
                        chassis_number: (_a = entry === null || entry === void 0 ? void 0 : entry.chassis_number) === null || _a === void 0 ? void 0 : _a.toString(),
                        challan_number: entry === null || entry === void 0 ? void 0 : entry.challan_number.toString(),
                        offense_details: entry === null || entry === void 0 ? void 0 : entry.offense_details,
                        challan_place: entry === null || entry === void 0 ? void 0 : entry.challan_place,
                        //@ts-ignore
                        challan_date: (entry === null || entry === void 0 ? void 0 : entry.challan_date) ? (0, helpers_1.excelSerialToJSDate)(entry === null || entry === void 0 ? void 0 : entry.challan_date).toString() : "null",
                        state: entry === null || entry === void 0 ? void 0 : entry.state,
                        rto: entry === null || entry === void 0 ? void 0 : entry.rto,
                        accused_name: entry === null || entry === void 0 ? void 0 : entry.accused_name,
                        amount: entry.amount,
                        challan_status: entry === null || entry === void 0 ? void 0 : entry.challan_status,
                        //@ts-ignore
                        challan_date_time: (entry === null || entry === void 0 ? void 0 : entry.challan_date_time) ? (0, helpers_1.excelSerialToJSDateTime)(entry.challan_date_time).toString() : "null",
                        upstream_code: (_b = entry === null || entry === void 0 ? void 0 : entry.upstream_code) === null || _b === void 0 ? void 0 : _b.toString(),
                        court_challan: entry === null || entry === void 0 ? void 0 : entry.court_challan,
                        comment: (_c = entry === null || entry === void 0 ? void 0 : entry.comment) === null || _c === void 0 ? void 0 : _c.toString(),
                        //@ts-ignore
                        state_name: entry["State Name"].toString()
                    },
                });
            }
            console.log("✅ Data successfully imported!");
        }
        catch (err) {
            console.error("❌ Error importing data:", err);
        }
        finally {
            // await prisma.$disconnect();
        }
    });
}
// Run the function
app.get("/upload-data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        importExcelData();
    }
    catch (error) {
        console.log(error);
    }
}));
// app.get("/pending-challans", async (req, res) => {
//     try {
//         const pendingChallans = await prisma.challan.findMany({
//             where: { challan_status: "Pending" },
//         });
//         res.json({
//             success: true,
//             NumberOfPendingChallans: pendingChallans.length,
//             data: pendingChallans,
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Error fetching data", error });
//     }
// });
// app.get("/online-offline-pending-fines", async (req, res) => {
//     try {
//         // Fetch total pending amount for Court Challans
//         const courtPending = await prisma.challan.aggregate({
//             _sum: { amount: true },
//             where: { challan_status: "Pending", court_challan: true },
//         });
//         console.log(courtPending)
//         // Fetch total pending amount for Online Challans
//         const onlinePending = await prisma.challan.aggregate({
//             _sum: { amount: true },
//             where: { challan_status: "Pending", court_challan: false },
//         });
//         console.log(onlinePending)
//         res.json({
//             success: true,
//             total_pending_fines: {
//                 court: courtPending._sum.amount || 0,
//                 online: onlinePending._sum.amount || 0,
//                 total: (courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)
//             }
//         });
//     } catch (error) {
//         console.error("❌ Error fetching pending fines:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// });
// app.get("/total-pending-fines-sum", async (req, res) => {
//     try {
//         const totalPendingAmount = await prisma.challan.aggregate({
//             _sum: { amount: true },
//             where: { challan_status: "Pending" },
//         });
//         console.log(totalPendingAmount)
//         // Get the total sum or default to 0 if no data
//         const totalAmount = totalPendingAmount._sum.amount || 0;
//         res.json({ success: true, total_pending_fines: totalAmount });
//     } catch (error) {
//         console.error("❌ Error fetching pending fines:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// });
// app.get("/higest-challan-lowest-challan", async (req, res) => {
//     try {
//         // Find the challan with the highest amount
//         const highestChallan = await prisma.challan.findFirst({
//             orderBy: { amount: "desc" } // Sort by amount in descending order
//         });
//         // Find the challan with the lowest amount
//         const lowestChallan = await prisma.challan.findFirst({
//             orderBy: { amount: "asc" } // Sort by amount in ascending order
//         });
//         res.json({
//             success: true,
//             highestChallan: highestChallan || null, // Return null if no data
//             lowestChallan: lowestChallan || null
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching extreme challan amounts",
//             error
//         });
//     }
// });
// app.get("/topstates-with-most-challans", async (req, res) => {
//     try {
//         // Find the top 5 states with the most challans
//         const topStates = await prisma.challan.groupBy({
//             by: ["state"],
//             _count: { id: true },
//             orderBy: { _count: { id: "desc" } },
//             take: 5
//         });
//         res.json({
//             success: true,
//             topStates: topStates.map(state => ({
//                 state: state.state,
//                 total_challans: state._count.id
//             }))
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching top states with maximum challans",
//             error
//         });
//     }
// });
// app.get("/peak-violation-months", async (req, res) => {
//     try {
//         // Group challans by month and count occurrences
//         const peakMonths = await prisma.challan.groupBy({
//             by: ["challan_date"],
//             _count: { id: true },
//             orderBy: { _count: { id: "desc" } }
//         });
//         // Transform data into a structured format
//         const monthWiseData: Record<string, number> = {};
//         peakMonths.forEach(challan => {
//             //@ts-ignore
//             let monthYear = new Date(challan.challan_date).toLocaleString("en-US", {
//                 month: "long",
//                 year: "numeric"
//             });
//             if (!monthWiseData[monthYear]) {
//                 monthWiseData[monthYear] = 0;
//             }
//             monthWiseData[monthYear] += challan._count.id;
//         });
//         // Convert object to sorted array
//         const sortedData = Object.entries(monthWiseData)
//             .map(([month, count]) => ({ month, total_violations: count }))
//             .sort((a, b) => b.total_violations - a.total_violations);
//         res.json({
//             success: true,
//             data: sortedData
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching peak violation months",
//             error
//         });
//     }
// });
// // app.get("/drivers-by-challan", async (req, res) => {
// //     try {
// //         // Fetch all challans grouped by driver
// //         const driverChallanValues = await prisma.challan.groupBy({
// //             by: ["rc_number", "accused_name"]
// //         });
// //         // Convert `amount` (String) to Number and sum manually
// //         const result = driverChallanValues.map(driver => ({
// //             rc_number: driver.rc_number,
// //             accused_name: driver.accused_name,
// //             //@ts-ignore
// //             total_challan_value: driver._sum?.amount 
// //                 //@ts-ignore
// //                 ? driver._sum.amount.reduce((acc, val) => acc + parseFloat(val), 0) // Convert to number and sum
// //                 : 0
// //         }));
// //         // Sort in descending order
// //         result.sort((a, b) => b.total_challan_value - a.total_challan_value);
// //         res.json({ success: true, topDriversByChallanValue: result.slice(0, 5) }); // Limit to top 5
// //     } catch (error) {
// //         res.status(500).json({
// //             success: false,
// //             message: "Error fetching drivers by challan value",
// //             error
// //         });
// //     }
// // });
// app.get("/drivers-by-challan-top-5", async (req, res) => {
//     try {
//         // Group challans by driver and sum total amount
//         const driverChallanValues = await prisma.challan.groupBy({
//             by: ["rc_number", "accused_name"],
//             _sum: { amount: true },
//             orderBy: { _sum: { amount: "desc" } },
//             take: 5 // Fetch top 5 drivers with highest challan amounts
//         });
//         res.json({
//             success: true,
//             topDriversByChallanValue: driverChallanValues.map(driver => ({
//                 rc_number: driver.rc_number,
//                 accused_name: driver.accused_name,
//                 total_challan_value: driver._sum.amount || 0
//             }))
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching drivers by challan value",
//             error
//         });
//     }
// });
// app.get("/average-challan-per-truck", async (req, res) => {
//     try {
//         // Fetch all challans with truck details
//         const challans = await prisma.challan.findMany({
//             select: {
//                 rc_number: true,
//                 amount: true // Now `amount` is an integer
//             }
//         });
//         // Type-safe object to store truck totals
//         const truckTotals: Record<string, TruckChallan> = {};
//         challans.forEach(({ rc_number, amount }) => {
//             if (!rc_number) return;
//             if (!amount) return;
//             if (!truckTotals[rc_number]) {
//                 truckTotals[rc_number] = { rc_number, totalAmount: 0, count: 0 };
//             }
//             truckTotals[rc_number].totalAmount += amount; // Sum amounts (Integer)
//             truckTotals[rc_number].count += 1; // Count occurrences
//         });
//         console.log(truckTotals)
//         // Convert data into a sorted array with average calculation
//         const sortedTrucks: TruckAverage[] = Object.values(truckTotals)
//             .map(truck => ({
//                 rc_number: truck.rc_number,
//                 average_challan_amount: Math.floor(truck.totalAmount / truck.count) // Ensure integer output
//             }))
//             .sort((a, b) => b.average_challan_amount - a.average_challan_amount); // Sort descending
//         res.json({
//             success: true,
//             data: sortedTrucks
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error calculating average challan amount per truck",
//             error
//         });
//     }
// });
// app.get("/challans-by-state-city", async (req, res) => {
//     try {
//         // Group by State & City (Challan Place)
//         const challanCounts = await prisma.challan.groupBy({
//             by: ["state", "challan_place"],
//             _count: {
//                 id: true, // Count number of challans
//             },
//             orderBy: {
//                 _count: {
//                     id: "desc", // Sort by highest violations
//                 },
//             },
//         });
//         res.json({
//             success: true,
//             violation_hotspots: challanCounts.map((entry) => ({
//                 state: entry.state,
//                 city: entry.challan_place,
//                 total_challans: entry._count.id,
//             })),
//         });
//     } catch (error) {
//         console.error("❌ Error fetching violation hotspots:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// });
// app.get("/challans-by-month", async (req, res) => {
//     try {
//         // Fetch all challans with date
//         const challans = await prisma.challan.findMany({
//             select: {
//                 challan_date: true
//             }
//         });
//         // Group challans by Month/Year
//         const monthlyChallans: Record<string, ChallanByMonth> = {};
//         challans.forEach(({ challan_date }) => {
//             if (!challan_date) return; // Skip if date is missing
//             const date = new Date(challan_date);
//             const year = date.getFullYear();
//             const month = date.toLocaleString("en-US", { month: "long" });
//             const key = `${month}-${year}`; // Format as "January-2024"
//             if (!monthlyChallans[key]) {
//                 monthlyChallans[key] = { month, year, total_challans: 0 };
//             }
//             monthlyChallans[key].total_challans += 1;
//         });
//         // Convert object to sorted array (oldest to newest)
//         const sortedData: ChallanByMonth[] = Object.values(monthlyChallans)
//             .sort((a, b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());
//         res.json({
//             success: true,
//             data: sortedData
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching challans by month/year",
//             error
//         });
//     }
// });
// app.get("/pending-duration-analysis", async (req, res) => {
//     try {
//         // Fetch all pending challans
//         const pendingChallans = await prisma.challan.findMany({
//             where: { challan_status: "Pending" },
//             select: {
//                 rc_number: true,
//                 accused_name: true,
//                 challan_number: true,
//                 challan_date: true
//             }
//         });
//         // Get current date
//         const today = new Date();
//         // Process each challan and calculate days pending
//         //@ts-ignore
//         const result: PendingChallan[] = pendingChallans.map(challan => {
//                    if(!challan.challan_date) return;
//             const challanDate = new Date(challan.challan_date);
//             const daysPending = Math.floor((today.getTime() - challanDate.getTime()) / (1000 * 60 * 60 * 24)); // Convert ms to days
//             return {
//                 rc_number: challan.rc_number,
//                 accused_name: challan.accused_name,
//                 challan_number: challan.challan_number,
//                 challan_date: challan.challan_date,
//                 days_pending: daysPending
//             };
//         });
//         // Sort by longest pending duration
//         result.sort((a, b) => b.days_pending - a.days_pending);
//         res.json({
//             success: true,
//             data: result
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching pending duration analysis",
//             error
//         });
//     }
// });
// app.get("/repeat-offenders", async (req, res) => {
//     try {
//         const { startDate, endDate } = req.query;
//         let whereCondition: any = {};
//         if (startDate && endDate) {
//             whereCondition.challan_date = {
//                 gte: new Date(startDate as string),
//                 lte: new Date(endDate as string)
//             };
//         }
//         // Find repeat offenders (drivers with more than one challan)
//         const offenders = await prisma.challan.groupBy({
//             by: ["rc_number", "accused_name"],
//             _count: { id: true },
//             where: whereCondition,
//             having: { id: { _count: { gt: 1 } } }, // Only include drivers with more than one challan
//             orderBy: { _count: { id: "desc" } }
//         });
//         // Format response data
//         //@ts-ignore
//         const result: RepeatOffender[] = offenders.map(offender => ({
//             rc_number: offender.rc_number,
//             accused_name: offender.accused_name,
//             total_challans: offender._count.id
//         }));
//         res.json({
//             success: true,
//             data: result
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching repeat offenders",
//             error
//         });
//     }
// });
// //@ts-ignore
// app.get("/challan-pending-percentage", async (req, res) => {
//     try {
//         // Fetch total pending challans
//         const totalPending = await prisma.challan.count({
//             where: { challan_status: "Pending" }
//         });
//         // Fetch pending court challans
//         const courtPending = await prisma.challan.count({
//             where: { challan_status: "Pending", court_challan: true }
//         });
//         // Fetch pending online challans
//         const onlinePending = totalPending - courtPending;
//         // Calculate percentages
//         const courtPercentage = totalPending ? (courtPending / totalPending) * 100 : 0;
//         const onlinePercentage = totalPending ? (onlinePending / totalPending) * 100 : 0;
//         const result: PendingChallanStats = {
//             total_pending_challans: totalPending,
//             court_challan_pending: courtPending,
//             online_challan_pending: onlinePending,
//             court_challan_percentage: parseFloat(courtPercentage.toFixed(2)),
//             online_challan_percentage: parseFloat(onlinePercentage.toFixed(2))
//         };
//         res.json({
//             success: true,
//             data: result
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching pending challan percentage",
//             error
//         });
//     }
// });
// import express from "express";
// import { PrismaClient } from "@prisma/client";
// const app = express();
// const prisma = new PrismaClient();
app.get("/analytics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [pendingChallans, courtPending, onlinePending, totalPendingAmount, highestChallan, lowestChallan, topStates, peakViolationMonths, topDriversByChallanValue, averageChallanPerTruckData, challansByStateCity, challansByMonth, pendingDurationAnalysis, repeatOffenders, totalPending] = yield Promise.all([
            prisma.challan.findMany({ where: { challan_status: "Pending" } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending", court_challan: true } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending", court_challan: false } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending" } }),
            prisma.challan.findFirst({ orderBy: { amount: "desc" } }),
            prisma.challan.findFirst({ orderBy: { amount: "asc" } }),
            prisma.challan.groupBy({ by: ["state"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
            prisma.challan.groupBy({ by: ["challan_date"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
            prisma.challan.groupBy({ by: ["rc_number", "accused_name"], _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 5 }),
            prisma.challan.findMany({ select: { rc_number: true, amount: true } }), // Fetch data for Average Challan Per Truck
            prisma.challan.groupBy({ by: ["state", "challan_place"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
            prisma.challan.findMany({ select: { challan_date: true } }),
            prisma.challan.findMany({ where: { challan_status: "Pending" }, select: { rc_number: true, accused_name: true, challan_number: true, challan_date: true } }),
            prisma.challan.groupBy({ by: ["rc_number", "accused_name"], _count: { id: true }, having: { id: { _count: { gt: 1 } } }, orderBy: { _count: { id: "desc" } } }),
            prisma.challan.count({ where: { challan_status: "Pending" } })
        ]);
        const today = new Date();
        const pendingDurationData = pendingDurationAnalysis.map(challan => ({
            rc_number: challan.rc_number,
            accused_name: challan.accused_name,
            challan_number: challan.challan_number,
            challan_date: challan.challan_date,
            days_pending: challan.challan_date ? Math.floor((today.getTime() - new Date(challan.challan_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
        })).sort((a, b) => b.days_pending - a.days_pending);
        const totalPendingFines = {
            court: courtPending._sum.amount || 0,
            online: onlinePending._sum.amount || 0,
            total: totalPendingAmount._sum.amount || 0
        };
        const peakViolationData = peakViolationMonths.reduce((acc, challan) => {
            //@ts-ignore
            const monthYear = new Date(challan.challan_date).toLocaleString("en-US", { month: "long", year: "numeric" });
            acc[monthYear] = (acc[monthYear] || 0) + challan._count.id;
            return acc;
        }, {});
        const sortedPeakViolations = Object.entries(peakViolationData).map(([month, count]) => ({ month, total_violations: count })).sort((a, b) => b.total_violations - a.total_violations);
        const totalOnlinePending = totalPending - (courtPending._sum.amount ? courtPending._sum.amount : 0);
        //@ts-ignore
        const courtPercentage = totalPending ? (courtPending._sum.amount / totalPending) * 100 : 0;
        const onlinePercentage = totalPending ? (totalOnlinePending / totalPending) * 100 : 0;
        // ✅ **Calculate Average Challan Per Truck**
        const truckTotals = {};
        averageChallanPerTruckData.forEach(({ rc_number, amount }) => {
            if (!rc_number || !amount)
                return;
            if (!truckTotals[rc_number]) {
                truckTotals[rc_number] = { totalAmount: 0, count: 0 };
            }
            truckTotals[rc_number].totalAmount += amount;
            truckTotals[rc_number].count += 1;
        });
        const averageChallanPerTruck = Object.entries(truckTotals)
            .map(([rc_number, data]) => ({
            rc_number,
            average_challan_amount: Math.floor(data.totalAmount / data.count)
        }))
            .sort((a, b) => b.average_challan_amount - a.average_challan_amount);
        res.json({
            success: true,
            data: {
                pending_challans: {
                    count: pendingChallans.length,
                    details: pendingChallans
                },
                total_pending_fines: totalPendingFines,
                highest_challan: highestChallan || null,
                lowest_challan: lowestChallan || null,
                top_states_with_most_challans: topStates.map(state => ({ state: state.state, total_challans: state._count.id })),
                peak_violation_months: sortedPeakViolations,
                top_drivers_by_challan_value: topDriversByChallanValue.map(driver => ({
                    rc_number: driver.rc_number,
                    accused_name: driver.accused_name,
                    total_challan_value: driver._sum.amount || 0
                })),
                pending_duration_analysis: pendingDurationData,
                repeat_offenders: repeatOffenders.map(offender => ({
                    rc_number: offender.rc_number,
                    accused_name: offender.accused_name,
                    total_challans: offender._count.id
                })),
                total_pending_challans: totalPending,
                pending_challan_percentage: {
                    total_pending_challans: totalPending,
                    court_challan_pending: courtPending._sum.amount || 0,
                    online_challan_pending: totalOnlinePending,
                    court_challan_percentage: parseFloat(courtPercentage.toFixed(2)),
                    online_challan_percentage: parseFloat(onlinePercentage.toFixed(2))
                },
                average_challan_per_truck: averageChallanPerTruck // ✅ Now included in analytics response
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching analytics data",
            error
        });
    }
}));
app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});
