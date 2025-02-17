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
const multer_1 = __importDefault(require("multer"));
const helpers_1 = require("./helpers/helpers");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
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
// Run the function
// importExcelData();
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Welcome");
}));
app.post("/upload-file", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Delete existing data before inserting new data
        yield prisma.challan.deleteMany();
        console.log("✅ Data successfully deleted!");
        if (!req.file) {
            res.status(400).json({ success: false, message: "No file uploaded." });
            return;
        }
        // ✅ Read Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[2]; // Ensure correct sheet is selected
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        console.log(`✅ Processing ${jsonData.length} records...`);
        // ✅ Format Data Before Bulk Insert
        const formattedEntries = jsonData.map(entry => {
            var _a, _b, _c, _d, _e;
            return ({
                rc_number: entry === null || entry === void 0 ? void 0 : entry.rc_number,
                chassis_number: (entry === null || entry === void 0 ? void 0 : entry.chassis_number) ? entry.chassis_number.toString() : "null",
                challan_number: (_a = entry === null || entry === void 0 ? void 0 : entry.challan_number) === null || _a === void 0 ? void 0 : _a.toString(),
                offense_details: entry === null || entry === void 0 ? void 0 : entry.offense_details,
                challan_place: entry === null || entry === void 0 ? void 0 : entry.challan_place, //@ts-ignore
                challan_date: (entry === null || entry === void 0 ? void 0 : entry.challan_date) ? (_b = (0, helpers_1.excelSerialToJSDate)(entry.challan_date)) === null || _b === void 0 ? void 0 : _b.toString() : "null",
                state: entry === null || entry === void 0 ? void 0 : entry.state,
                rto: (entry === null || entry === void 0 ? void 0 : entry.rto) || null,
                accused_name: entry === null || entry === void 0 ? void 0 : entry.accused_name,
                amount: entry.amount,
                challan_status: entry === null || entry === void 0 ? void 0 : entry.challan_status, //@ts-ignore
                challan_date_time: (entry === null || entry === void 0 ? void 0 : entry.challan_date_time) ? (_c = (0, helpers_1.excelSerialToJSDateTime)(entry.challan_date_time)) === null || _c === void 0 ? void 0 : _c.toString() : "null",
                upstream_code: (_d = entry === null || entry === void 0 ? void 0 : entry.upstream_code) === null || _d === void 0 ? void 0 : _d.toString(),
                court_challan: entry === null || entry === void 0 ? void 0 : entry.court_challan,
                comment: (entry === null || entry === void 0 ? void 0 : entry.comment) ? entry.comment.toString() : null,
                state_name: (_e = entry === null || entry === void 0 ? void 0 : entry.state_name) === null || _e === void 0 ? void 0 : _e.toString()
            });
        });
        // ✅ Use `createMany()` for bulk insert
        yield prisma.challan.createMany({
            data: formattedEntries,
            skipDuplicates: true // Prevents duplicate errors
        });
        console.log(`✅ Successfully inserted ${formattedEntries.length} records!`);
        res.json({ success: true, message: "Data successfully imported!", totalRecords: formattedEntries.length });
    }
    catch (error) {
        console.error("❌ Error processing file:", error);
        res.status(500).json({ success: false, message: "Error processing file", error });
    }
}));
app.get("/analytics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Execute all queries in parallel using Promise.all
        const [pendingChallans, courtPending, onlinePending, totalPendingAmount, highestChallan, lowestChallan, topStates, peakViolationMonths, topDriversByChallanValue, averageChallanPerTruckData, challansByStateCity, challansByMonth, pendingDurationAnalysis, repeatOffenders, totalPending, overallChallanStatus, uniqueVehiclesByStatus] = yield Promise.all([
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
            prisma.challan.count({ where: { challan_status: "Pending" } }),
            prisma.challan.groupBy({
                by: ["challan_status"],
                _count: { id: true },
                _sum: { amount: true },
            }),
            prisma.challan.findMany({
                select: { challan_status: true, rc_number: true },
                distinct: ["challan_status", "rc_number"]
            })
        ]);
        const violationHotspots = challansByStateCity.map(entry => {
            var _a, _b;
            return ({
                state: (_a = entry.state) !== null && _a !== void 0 ? _a : "Unknown", // Handle null state values
                city: (_b = entry.challan_place) !== null && _b !== void 0 ? _b : "Unknown", // Handle null city values
                total_challans: entry._count.id
            });
        });
        const today = new Date();
        const pendingDurationData = pendingDurationAnalysis.map(challan => ({
            rc_number: challan.rc_number,
            accused_name: challan.accused_name,
            challan_number: challan.challan_number,
            challan_date: challan.challan_date,
            days_pending: challan.challan_date ? Math.floor((today.getTime() - new Date(challan.challan_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
        })).sort((a, b) => b.days_pending - a.days_pending);
        const courtPendingAmount = courtPending._sum.amount || 0;
        const onlinePendingAmount = onlinePending._sum.amount || 0;
        const totalPendingAmountValue = courtPendingAmount + onlinePendingAmount;
        const courtPercentage = totalPendingAmountValue ? (courtPendingAmount / totalPendingAmountValue) * 100 : 0;
        const onlinePercentage = totalPendingAmountValue ? (onlinePendingAmount / totalPendingAmountValue) * 100 : 0;
        // ✅ Fix Peak Violation Months
        const peakViolationData = {};
        peakViolationMonths.forEach(challan => {
            //@ts-ignore
            const monthYear = new Date(challan.challan_date).toLocaleString("en-US", { month: "long", year: "numeric" });
            if (!peakViolationData[monthYear])
                peakViolationData[monthYear] = 0;
            peakViolationData[monthYear] += challan._count.id;
        });
        const sortedPeakViolations = Object.entries(peakViolationData)
            .map(([month, totalViolations]) => ({ month, total_violations: totalViolations }))
            .sort((a, b) => b.total_violations - a.total_violations);
        // ✅ Fix Average Challan Per Truck
        const truckTotals = {};
        averageChallanPerTruckData.forEach(({ rc_number, amount }) => {
            if (!rc_number || !amount)
                return;
            if (!truckTotals[rc_number])
                truckTotals[rc_number] = { totalAmount: 0, count: 0 };
            truckTotals[rc_number].totalAmount += amount;
            truckTotals[rc_number].count += 1;
        });
        const averageChallanPerTruck = Object.entries(truckTotals)
            .map(([rc_number, data]) => ({
            rc_number,
            average_challan_amount: Math.floor(data.totalAmount / data.count)
        }))
            .sort((a, b) => b.average_challan_amount - a.average_challan_amount);
        const vehicleCountMap = {};
        uniqueVehiclesByStatus.forEach(entry => {
            var _a;
            const statusKey = (_a = entry.challan_status) !== null && _a !== void 0 ? _a : "Unknown";
            vehicleCountMap[statusKey] = (vehicleCountMap[statusKey] || 0) + 1;
        });
        let totalUniqueVehicles = 0;
        let totalChallans = 0;
        let totalAmount = 0;
        const challanStatusData = overallChallanStatus.map(status => {
            var _a;
            const statusKey = (_a = status.challan_status) !== null && _a !== void 0 ? _a : "Unknown";
            const statusAmount = status._sum.amount || 0;
            const statusChallans = status._count.id || 0;
            const uniqueVehicles = vehicleCountMap[statusKey] || 0;
            totalUniqueVehicles += uniqueVehicles;
            totalChallans += statusChallans;
            totalAmount += statusAmount;
            return {
                Status: status.challan_status,
                "Unique Vehicle Count": uniqueVehicles,
                "No of Challan": statusChallans,
                "Amount": `₹${statusAmount.toLocaleString()}`
            };
        });
        console.log(overallChallanStatus);
        // ✅ Add Grand Total Row
        challanStatusData.push({
            Status: "Grand Total",
            "Unique Vehicle Count": totalUniqueVehicles,
            "No of Challan": totalChallans,
            "Amount": `₹${totalAmount.toLocaleString()}`
        });
        console.log(challanStatusData);
        res.json({
            success: true,
            data: {
                // pending_challans: {
                //     count: pendingChallans?.length,
                //     details: pendingChallans
                // },
                total_pending_fines: {
                    court: courtPendingAmount,
                    online: onlinePendingAmount,
                    total: totalPendingAmountValue
                },
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
                    court_challan_pending: courtPendingAmount,
                    online_challan_pending: onlinePendingAmount,
                    court_challan_percentage: parseFloat(courtPercentage.toFixed(2)),
                    online_challan_percentage: parseFloat(onlinePercentage.toFixed(2))
                },
                average_challan_per_truck: averageChallanPerTruck,
                "Overall Challan Status": {
                    "Status of Challans": challanStatusData
                },
                violation_hotspots: violationHotspots
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error fetching analytics data",
            error
        });
    }
}));
app.listen(4000, () => {
    console.log(`Server is running on port ${4000}`);
});
module.exports = app;
