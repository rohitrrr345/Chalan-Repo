import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import express from "express"
import multer from "multer"

import path from "path";
import { ChallanByMonth, PendingChallan, PendingChallanStats, RepeatOffender, TruckAverage, TruckChallan } from "./types/challan";
import { excelSerialToJSDate, excelSerialToJSDateTime, extractCity } from "./helpers/helpers";
const app = express()
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

async function fetchPendingChallans() {
    try {
        // Fetch all challans where status is "Pending"
        const pendingChallans = await prisma.challan.findMany({
            where: {
                challan_status: "Pending"
            }
        });

        // Print or return the fetched data
        console.log("✅ Pending Challans:", pendingChallans);
        return pendingChallans;
    } catch (error) {
        console.error("❌ Error fetching pending challans:", error);
    } finally {
        await prisma.$disconnect(); // Close the database connection
    }
}
interface ChallanEntry {
    rc_number: string;
    chassis_number?: string; // Optional
    challan_number: string;
    offense_details: string;
    challan_place: string;
    challan_date: () => string;
    state: string;
    rto: string
    accused_name: string;
    amount: number;
    challan_status: string;
    challan_date_time: string;
    upstream_code: string;
    court_challan: boolean;
    comment: string;
    state_name: string;
}

// Run the function
// importExcelData();

app.get("/", async (req, res)=>{
     res.send("Welcome")
});

app.post("/upload-file", upload.single("file"), async (req, res): Promise<void> => {
    try {
        // ✅ Delete existing data before inserting new data
        await prisma.challan.deleteMany();
        console.log("✅ Data successfully deleted!");

        if (!req.file) {
             res.status(400).json({ success: false, message: "No file uploaded." });
             return
        }

        // ✅ Read Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[2]; // Ensure correct sheet is selected
        const sheet = workbook.Sheets[sheetName];
        const jsonData: ChallanEntry[] = XLSX.utils.sheet_to_json(sheet);


        console.log(`✅ Processing ${jsonData.length} records...`);

        // ✅ Format Data Before Bulk Insert
        const formattedEntries = jsonData.map(entry => ({
            rc_number: entry?.rc_number,            
            chassis_number: entry?.chassis_number ? entry.chassis_number.toString() : "null",
            challan_number: entry?.challan_number?.toString(),
            offense_details: entry?.offense_details,
            challan_place: entry?.challan_place,//@ts-ignore
            challan_date: entry?.challan_date ? excelSerialToJSDate(entry.challan_date)?.toString() : "null",
            state: entry?.state,
            rto: entry?.rto || null,
            accused_name: entry?.accused_name,
            amount: entry.amount,
            challan_status: entry?.challan_status,//@ts-ignore
            challan_date_time: entry?.challan_date_time ? excelSerialToJSDateTime(entry.challan_date_time)?.toString() : "null",
            upstream_code: entry?.upstream_code?.toString(),
            court_challan: entry?.court_challan,
            comment: entry?.comment ? entry.comment.toString() : null,
            state_name: entry?.state_name?.toString()
        }));

        // ✅ Use `createMany()` for bulk insert
        await prisma.challan.createMany({
            data: formattedEntries,
            skipDuplicates: true // Prevents duplicate errors
        });

        console.log(`✅ Successfully inserted ${formattedEntries.length} records!`);

        res.json({ success: true, message: "Data successfully imported!", totalRecords: formattedEntries.length });

    } catch (error) {
        console.error("❌ Error processing file:", error);
        res.status(500).json({ success: false, message: "Error processing file", error });
    }
});




app.get("/analytics", async (req, res) => {
    try {
        // Execute all queries in parallel using Promise.all
        const [
            pendingChallans,
            courtPending,
            onlinePending,
            totalPendingAmount,
            highestChallan,
            lowestChallan,
            topStates,
            peakViolationMonths,
            topDriversByChallanValue,
            averageChallanPerTruckData,
            challansByStateCity,
            challansByMonth,
            pendingDurationAnalysis,
            repeatOffenders,
            totalPending,
            overallChallanStatus,
            uniqueVehiclesByStatus
        ] = await Promise.all([
            prisma.challan.findMany({ where: { challan_status: "Pending" } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending", court_challan: true } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending", court_challan: false } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending" } }),
            prisma.challan.findFirst({ orderBy: { amount: "desc" } }),
            prisma.challan.findFirst({ orderBy: { amount: "asc" } }),
            prisma.challan.groupBy({ by: ["state"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
            prisma.challan.groupBy({ by: ["challan_date"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
            prisma.challan.groupBy({
                by: ["rc_number", "accused_name"],
                _sum: { amount: true },
                where: { amount: { not: null } },  // Exclude null amounts
                orderBy: { _sum: { amount: "desc" } },
                take: 5
            }),            prisma.challan.findMany({ select: { rc_number: true, amount: true } }), // Fetch data for Average Challan Per Truck
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
        const violationHotspots = challansByStateCity.map(entry => ({
            state: entry.state ?? "Unknown", // Handle null state values
            city:  extractCity(entry.challan_place ?? "Unknown"), // Handle null city values
            total_challans: entry._count.id
           }));
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
        const peakViolationData: Record<string, number> = {};
        peakViolationMonths.forEach(challan => {
            //@ts-ignore
            const monthYear = new Date(challan.challan_date).toLocaleString("en-US", { month: "long", year: "numeric" });
            if (!peakViolationData[monthYear]) peakViolationData[monthYear] = 0;
            peakViolationData[monthYear] += challan._count.id;
        });

        const sortedPeakViolations = Object.entries(peakViolationData)
            .map(([month, totalViolations]) => ({ month, total_violations: totalViolations }))
            .sort((a, b) => b.total_violations - a.total_violations);

        // ✅ Fix Average Challan Per Truck
        const truckTotals: Record<string, { totalAmount: number; count: number }> = {};
        averageChallanPerTruckData.forEach(({ rc_number, amount }) => {
            if (!rc_number || !amount) return;
            if (!truckTotals[rc_number]) truckTotals[rc_number] = { totalAmount: 0, count: 0 };
            truckTotals[rc_number].totalAmount += amount;
            truckTotals[rc_number].count += 1;
        });

        const averageChallanPerTruck = Object.entries(truckTotals)
            .map(([rc_number, data]) => ({
                rc_number,
                average_challan_amount: Math.floor(data.totalAmount / data.count)
            }))
            .sort((a, b) => b.average_challan_amount - a.average_challan_amount);






            const vehicleCountMap: Record<string, number> = {};
uniqueVehiclesByStatus.forEach(entry => {

    const statusKey = entry.challan_status ?? "Unknown";
    vehicleCountMap[statusKey] = (vehicleCountMap[statusKey] || 0) + 1;
});


            let totalUniqueVehicles = 0;
        let totalChallans = 0;
        let totalAmount = 0;
        const challanStatusData = overallChallanStatus.map(status => {

            const statusKey = status.challan_status ?? "Unknown";
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
        console.log(overallChallanStatus)
        // ✅ Add Grand Total Row
        challanStatusData.push({
            Status: "Grand Total",
            "Unique Vehicle Count": totalUniqueVehicles,
            "No of Challan": totalChallans,
            "Amount": `₹${totalAmount.toLocaleString()}`
        });

        console.log(topDriversByChallanValue)
        
      
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
                top_drivers_by_challan_amount_value: topDriversByChallanValue.map(driver => ({
                    rc_number: driver.rc_number,
                    accused_name: driver.accused_name,
                    total_challan_amount_value: driver._sum.amount || 0
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
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error fetching analytics data",
            error
        });
    }
});





app.listen(4000, () => {
    console.log(`Server is running on port ${4000}`);
});

module.exports = app;