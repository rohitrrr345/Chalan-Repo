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
// Load environment variables
// dotenv.config();
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
//@ts-ignore
function excelSerialToJSDate(serial) {
    if (!serial || isNaN(serial))
        return null; // Handle missing/invalid values
    // Convert Excel serial number to milliseconds
    const excelEpoch = new Date(1900, 0, 1);
    const milliseconds = (serial - 1) * 86400000; // Convert days to ms
    // Fix Excel leap year bug (Excel incorrectly includes Feb 29, 1900)
    let finalDate = new Date(excelEpoch.getTime() + milliseconds);
    if (serial >= 60) {
        finalDate.setDate(finalDate.getDate() - 1);
    }
    // Format the date as MM/DD/YYYY
    const formattedDate = `${(finalDate.getMonth() + 1).toString().padStart(2, "0") // Month (1-based)
    }/${finalDate.getDate().toString().padStart(2, "0") // Day
    }/${finalDate.getFullYear() // Year
    }`;
    return formattedDate;
}
//@ts-ignore
function excelSerialToJSDateTime(serial) {
    if (!serial || isNaN(serial))
        return null; // Handle missing/invalid values
    // Convert Excel serial number to milliseconds
    const excelEpoch = new Date(1900, 0, 1);
    const milliseconds = (serial - 1) * 86400000; // Convert days to ms
    // Fix Excel leap year bug (Excel incorrectly includes Feb 29, 1900)
    let finalDate = new Date(excelEpoch.getTime() + milliseconds);
    if (serial >= 60) {
        finalDate.setDate(finalDate.getDate() - 1);
    }
    // Convert fractional part to hours, minutes, seconds
    const timeFraction = serial % 1; // Extract decimal part (time)
    const hours = Math.floor(timeFraction * 24);
    const minutes = Math.floor((timeFraction * 1440) % 60);
    const seconds = Math.floor((timeFraction * 86400) % 60);
    // Set time on the final date
    finalDate.setHours(hours, minutes, seconds);
    // Format the date as MM/DD/YYYY HH:MM:SS
    const formattedDate = `${(finalDate.getMonth() + 1).toString().padStart(2, "0") // Month (1-based)
    }/${finalDate.getDate().toString().padStart(2, "0") // Day
    }/${finalDate.getFullYear() // Year
    } ${finalDate.getHours().toString().padStart(2, "0") // Hours
    }:${finalDate.getMinutes().toString().padStart(2, "0") // Minutes
    }:${finalDate.getSeconds().toString().padStart(2, "0") // Seconds
    }`;
    return formattedDate;
}
const prisma = new client_1.PrismaClient();
function fetchPendingChallans() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all challans where status is "Pending"
            const pendingChallans = yield prisma.challan.findMany({
                where: {
                    challan_status: "Pending"
                }
            });
            // Print or return the fetched data
            console.log("✅ Pending Challans:", pendingChallans);
            return pendingChallans;
        }
        catch (error) {
            console.error("❌ Error fetching pending challans:", error);
        }
        finally {
            yield prisma.$disconnect(); // Close the database connection
        }
    });
}
function importExcelData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Load the Excel file
            const filePath = path_1.default.join(process.cwd(), "data.xlsx");
            console.log(filePath, "file path");
            const workbook = XLSX.readFile("C:\\Users\\Lenovo\\Desktop\\Copy\\data.xlsx"); // Replace with your Excel file
            const sheetName = workbook.SheetNames[2]; // Get first sheet
            const sheet = workbook.Sheets[sheetName];
            // Convert sheet data to JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            // console.log(jsonData,"json data");
            // Loop through each row in the sheet
            // const data = jsonData.map(async (entry) => {
            //     console.log(entry,"entry");
            // });
            let count = 0;
            // Create a new Challan entry
            // for (const entry of jsonData) {
            //     count++;
            //     console.log(count,"entry");
            //     await prisma.challan.create({
            //         data: {
            //             rc_number: entry?.rc_number,
            //             chassis_number: entry?.chassis_number?.toString(),
            //             challan_number: entry?.challan_number.toString(),
            //             offense_details: entry?.offense_details,
            //             challan_place: entry?.challan_place,
            //             //@ts-ignore
            //             challan_date: entry?.challan_date ?excelSerialToJSDate(entry?.challan_date).toString(): "null",         
            //             state: entry?.state,
            //             rto: entry?.rto,
            //             accused_name: entry?.accused_name,
            //             amount: entry.amount,
            //             challan_status: entry?.challan_status,
            //             //@ts-ignore
            //             challan_date_time: entry?.challan_date_time ? excelSerialToJSDateTime(entry.challan_date_time).toString() : "null",
            //             upstream_code: entry?.upstream_code?.toString(),
            //             court_challan: entry?.court_challan,
            //             comment: entry?.comment?.toString(),
            //             //@ts-ignore
            //             state_name: entry["State Name"].toString()
            //         },
            //     });
            // }
            // // await prisma.challan.deleteMany();
            // const value=excelSerialToJSDate(45620)
            // console.log(value)
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
importExcelData();
app.get("/pending-challans", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pendingChallans = yield prisma.challan.findMany({
            where: { challan_status: "Pending" },
        });
        res.json({ success: true,
            NumberOfPendingChallans: pendingChallans.length,
            data: pendingChallans,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error fetching data", error });
    }
}));
app.get("/online-offline-pending-fines", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch total pending amount for Court Challans
        const courtPending = yield prisma.challan.aggregate({
            _sum: { amount: true },
            where: { challan_status: "Pending", court_challan: true },
        });
        console.log(courtPending);
        // Fetch total pending amount for Online Challans
        const onlinePending = yield prisma.challan.aggregate({
            _sum: { amount: true },
            where: { challan_status: "Pending", court_challan: false },
        });
        console.log(onlinePending);
        res.json({
            success: true,
            total_pending_fines: {
                court: courtPending._sum.amount || 0,
                online: onlinePending._sum.amount || 0,
                total: (courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)
            }
        });
    }
    catch (error) {
        console.error("❌ Error fetching pending fines:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}));
app.get("/total-pending-fines-sum", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalPendingAmount = yield prisma.challan.aggregate({
            _sum: { amount: true },
            where: { challan_status: "Pending" },
        });
        console.log(totalPendingAmount);
        // Get the total sum or default to 0 if no data
        const totalAmount = totalPendingAmount._sum.amount || 0;
        res.json({ success: true, total_pending_fines: totalAmount });
    }
    catch (error) {
        console.error("❌ Error fetching pending fines:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}));
// // ✅ API Route: Get Total Pending Challan Amount (In Courts & Online)
app.get("/higest-challan-lowest-challan", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the challan with the highest amount
        const highestChallan = yield prisma.challan.findFirst({
            orderBy: { amount: "desc" } // Sort by amount in descending order
        });
        // Find the challan with the lowest amount
        const lowestChallan = yield prisma.challan.findFirst({
            orderBy: { amount: "asc" } // Sort by amount in ascending order
        });
        res.json({
            success: true,
            highestChallan: highestChallan || null, // Return null if no data
            lowestChallan: lowestChallan || null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching extreme challan amounts",
            error
        });
    }
}));
app.get("/topstates-with-most-challans", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the top 5 states with the most challans
        const topStates = yield prisma.challan.groupBy({
            by: ["state"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5
        });
        res.json({
            success: true,
            topStates: topStates.map(state => ({
                state: state.state,
                total_challans: state._count.id
            }))
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching top states with maximum challans",
            error
        });
    }
}));
app.get("/peak-violation-months", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Group challans by month and count occurrences
        const peakMonths = yield prisma.challan.groupBy({
            by: ["challan_date"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } }
        });
        // Transform data into a structured format
        const monthWiseData = {};
        peakMonths.forEach(challan => {
            //@ts-ignore
            let monthYear = new Date(challan.challan_date).toLocaleString("en-US", {
                month: "long",
                year: "numeric"
            });
            if (!monthWiseData[monthYear]) {
                monthWiseData[monthYear] = 0;
            }
            monthWiseData[monthYear] += challan._count.id;
        });
        // Convert object to sorted array
        const sortedData = Object.entries(monthWiseData)
            .map(([month, count]) => ({ month, total_violations: count }))
            .sort((a, b) => b.total_violations - a.total_violations);
        res.json({
            success: true,
            data: sortedData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching peak violation months",
            error
        });
    }
}));
// app.get("/drivers-by-challan", async (req, res) => {
//     try {
//         // Fetch all challans grouped by driver
//         const driverChallanValues = await prisma.challan.groupBy({
//             by: ["rc_number", "accused_name"]
//         });
//         // Convert `amount` (String) to Number and sum manually
//         const result = driverChallanValues.map(driver => ({
//             rc_number: driver.rc_number,
//             accused_name: driver.accused_name,
//             //@ts-ignore
//             total_challan_value: driver._sum?.amount 
//                 //@ts-ignore
//                 ? driver._sum.amount.reduce((acc, val) => acc + parseFloat(val), 0) // Convert to number and sum
//                 : 0
//         }));
//         // Sort in descending order
//         result.sort((a, b) => b.total_challan_value - a.total_challan_value);
//         res.json({ success: true, topDriversByChallanValue: result.slice(0, 5) }); // Limit to top 5
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error fetching drivers by challan value",
//             error
//         });
//     }
// });
app.get("/drivers-by-challan-top-5", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Group challans by driver and sum total amount
        const driverChallanValues = yield prisma.challan.groupBy({
            by: ["rc_number", "accused_name"],
            _sum: { amount: true },
            orderBy: { _sum: { amount: "desc" } },
            take: 5 // Fetch top 5 drivers with highest challan amounts
        });
        res.json({
            success: true,
            topDriversByChallanValue: driverChallanValues.map(driver => ({
                rc_number: driver.rc_number,
                accused_name: driver.accused_name,
                total_challan_value: driver._sum.amount || 0
            }))
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching drivers by challan value",
            error
        });
    }
}));
app.get("/average-challan-per-truck", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch all challans with truck details
        const challans = yield prisma.challan.findMany({
            select: {
                rc_number: true,
                amount: true // Now `amount` is an integer
            }
        });
        // Type-safe object to store truck totals
        const truckTotals = {};
        challans.forEach(({ rc_number, amount }) => {
            if (!rc_number)
                return;
            if (!amount)
                return;
            if (!truckTotals[rc_number]) {
                truckTotals[rc_number] = { rc_number, totalAmount: 0, count: 0 };
            }
            truckTotals[rc_number].totalAmount += amount; // Sum amounts (Integer)
            truckTotals[rc_number].count += 1; // Count occurrences
        });
        console.log(truckTotals);
        // Convert data into a sorted array with average calculation
        const sortedTrucks = Object.values(truckTotals)
            .map(truck => ({
            rc_number: truck.rc_number,
            average_challan_amount: Math.floor(truck.totalAmount / truck.count) // Ensure integer output
        }))
            .sort((a, b) => b.average_challan_amount - a.average_challan_amount); // Sort descending
        res.json({
            success: true,
            data: sortedTrucks
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error calculating average challan amount per truck",
            error
        });
    }
}));
app.get("/challans-by-state-city", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Group by State & City (Challan Place)
        const challanCounts = yield prisma.challan.groupBy({
            by: ["state", "challan_place"],
            _count: {
                id: true, // Count number of challans
            },
            orderBy: {
                _count: {
                    id: "desc", // Sort by highest violations
                },
            },
        });
        res.json({
            success: true,
            violation_hotspots: challanCounts.map((entry) => ({
                state: entry.state,
                city: entry.challan_place,
                total_challans: entry._count.id,
            })),
        });
    }
    catch (error) {
        console.error("❌ Error fetching violation hotspots:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}));
app.get("/challans-by-month", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch all challans with date
        const challans = yield prisma.challan.findMany({
            select: {
                challan_date: true
            }
        });
        // Group challans by Month/Year
        const monthlyChallans = {};
        challans.forEach(({ challan_date }) => {
            if (!challan_date)
                return; // Skip if date is missing
            const date = new Date(challan_date);
            const year = date.getFullYear();
            const month = date.toLocaleString("en-US", { month: "long" });
            const key = `${month}-${year}`; // Format as "January-2024"
            if (!monthlyChallans[key]) {
                monthlyChallans[key] = { month, year, total_challans: 0 };
            }
            monthlyChallans[key].total_challans += 1;
        });
        // Convert object to sorted array (oldest to newest)
        const sortedData = Object.values(monthlyChallans)
            .sort((a, b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());
        res.json({
            success: true,
            data: sortedData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching challans by month/year",
            error
        });
    }
}));
app.get("/pending-duration-analysis", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch all pending challans
        const pendingChallans = yield prisma.challan.findMany({
            where: { challan_status: "Pending" },
            select: {
                rc_number: true,
                accused_name: true,
                challan_number: true,
                challan_date: true
            }
        });
        // Get current date
        const today = new Date();
        // Process each challan and calculate days pending
        //@ts-ignore
        const result = pendingChallans.map(challan => {
            //@ts-ignore
            const challanDate = new Date(challan.challan_date);
            const daysPending = Math.floor((today.getTime() - challanDate.getTime()) / (1000 * 60 * 60 * 24)); // Convert ms to days
            return {
                rc_number: challan.rc_number,
                accused_name: challan.accused_name,
                challan_number: challan.challan_number,
                challan_date: challan.challan_date,
                days_pending: daysPending
            };
        });
        // Sort by longest pending duration
        result.sort((a, b) => b.days_pending - a.days_pending);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching pending duration analysis",
            error
        });
    }
}));
app.get("/repeat-offenders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        let whereCondition = {};
        if (startDate && endDate) {
            whereCondition.challan_date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        // Find repeat offenders (drivers with more than one challan)
        const offenders = yield prisma.challan.groupBy({
            by: ["rc_number", "accused_name"],
            _count: { id: true },
            where: whereCondition,
            having: { id: { _count: { gt: 1 } } }, // Only include drivers with more than one challan
            orderBy: { _count: { id: "desc" } }
        });
        // Format response data
        //@ts-ignore
        const result = offenders.map(offender => ({
            rc_number: offender.rc_number,
            accused_name: offender.accused_name,
            total_challans: offender._count.id
        }));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching repeat offenders",
            error
        });
    }
}));
//@ts-ignore
app.get("/challans-by-vehicle/:rc_number", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rc_number } = req.params;
        if (!rc_number) {
            return res.status(400).json({
                success: false,
                message: "Vehicle registration number (rc_number) is required."
            });
        }
        // Fetch all challans for the given vehicle registration number
        const challans = yield prisma.challan.findMany({
            where: { rc_number },
            select: {
                challan_number: true,
                accused_name: true,
                offense_details: true,
                challan_date: true,
                amount: true,
                challan_status: true
            },
            orderBy: { challan_date: "desc" } // Sort by latest first
        });
        res.json({
            success: true,
            data: challans
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching challans by vehicle registration number",
            error
        });
    }
}));
app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});
