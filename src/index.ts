import { PrismaClient } from "@prisma/client";
import express from "express"
const xlsx = require("xlsx");

import multer from "multer"
import path from "path";
import fs from "fs";
import { ChallanByMonth, PendingChallan, PendingChallanStats, RepeatOffender, TruckAverage, TruckChallan } from "./types/challan";
import { excelSerialToJSDate, excelSerialToJSDateTime, extractCity } from "./helpers/helpers";
import { json } from "stream/consumers";
const app = express()
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

interface ChallanStatusEntry {
    month: string;
    pending: number;
    in_process: number;
    disposed: number;
    not_paid: number;
}

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
        await prisma.challan.deleteMany();
        console.log(" Data successfully deleted!");

        if (!req.file) {
             res.status(400).json({ success: false, message: "No file uploaded." });
             return
        }

        // ✅ Read Excel file from buffer
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0]; // Ensure correct sheet is selected
        console.log(workbook.SheetNames)
        const sheet = workbook.Sheets[sheetName];
        const jsonData: ChallanEntry[] = xlsx.utils.sheet_to_json(sheet);
        console.log(` Processing ${jsonData.length} records...`);
        jsonData.forEach((entry, index) => {
            console.log(entry)
        })

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

        await prisma.challan.createMany({
            data: formattedEntries,
            skipDuplicates: true // Prevents duplicate errors
        });

        console.log(` Successfully inserted ${formattedEntries.length} records!`);

        res.json({ success: true, message: "Data successfully imported!"});

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
            uniqueVehiclesByStatus,
            
        ] = await Promise.all([
            prisma.challan.findMany({ where: { challan_status: "Pending" } }),//const item
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
            const monthYear = new Date(challan.challan_date)?.toLocaleString("en-US", { month: "long", year: "numeric" });
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
                // pending_duration_analysis: pendingDurationData,
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


app.get("/analyticsSheet", async (req, res) => {
    try {
        // ✅ Fetch Data from Database
        const [
            courtPending,
            onlinePending,
            highestChallan,
            lowestChallan,
            topStates,
            pendingDurationAnalysis,
            overallChallanStatus,
            violationHotspots,
            averageChallanPerTruckData,
            repeatOffenders,
            topDriversByChallanValue,
            peakViolationMonths,
            challanStatusOverTime,
            resolutionData


        ] = await Promise.all([
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending", court_challan: true } }),
            prisma.challan.aggregate({ _sum: { amount: true }, where: { challan_status: "Pending", court_challan: false } }),
            prisma.challan.findFirst({ orderBy: { amount: "desc" } }),
            prisma.challan.findFirst({ orderBy: { amount: "asc" } }),
            prisma.challan.groupBy({ by: ["state"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
            prisma.challan.findMany({
                where: { challan_status: "Pending" },
                select: { rc_number: true, accused_name: true, challan_number: true, challan_date: true },
            }),
            prisma.challan.groupBy({ by: ["challan_status"], _count: { id: true }, _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 5 }),
            prisma.challan.groupBy({ by: ["state", "challan_place"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
            prisma.challan.groupBy({ by: ["rc_number"], _avg: { amount: true }, _count: { id: true }, orderBy: { _avg: { amount: "desc" } }, take: 5 }),
            prisma.challan.groupBy({ by: ["rc_number", "accused_name"], _count: { id: true }, having: { id: { _count: { gt: 1 } } }, orderBy: { _count: { id: "desc" } }, take: 5 }),
            prisma.challan.groupBy({
                by: ["rc_number", "accused_name"],
                _sum: { amount: true },
                where: { amount: { not: null } },  // Exclude null amounts
                orderBy: { _sum: { amount: "desc" } },
                take: 5
            }),    
            prisma.challan.groupBy({ by: ["challan_date"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
            prisma.challan.groupBy({
                by: ["challan_date", "challan_status"],
                _count: { id: true },
                orderBy: { challan_date: "asc" }
            }),
            prisma.challan.groupBy({
                by: ["challan_status", "court_challan"], // Check if it was resolved via Lok Adalat (court)
                _count: { id: true },
            })

        ]);



        const today = new Date();

        // ✅ Format Pending Duration Analysis (Top 5)
        const pendingDurationData = pendingDurationAnalysis
        .map(challan => ({
            rc_number: challan.rc_number,
            accused_name: challan.accused_name,
            challan_number: challan.challan_number,
            challan_date: challan.challan_date,
            days_pending: challan.challan_date 
                ? Math.floor((today.getTime() - new Date(challan.challan_date).getTime()) / (1000 * 60 * 60 * 24)) 
                : 0
        }))
        .sort((a, b) => b.days_pending - a.days_pending) // Sort by max days pending first
        .slice(0, 5); // Take only the first 5 entries
    
        const peakViolationData: Record<string, number> = {};
        peakViolationMonths.forEach(challan => {
            //@ts-ignore
            const monthYear = new Date(challan.challan_date)?.toLocaleString("en-US", { month: "long", year: "numeric" });
            if (!peakViolationData[monthYear]) peakViolationData[monthYear] = 0;
            peakViolationData[monthYear] += challan._count.id;
        });

        const sortedPeakViolations = Object.entries(peakViolationData)
            .map(([month, totalViolations]) => ({ month, total_violations: totalViolations }))
            .sort((a, b) => b.total_violations - a.total_violations);


            const monthlyData = {};
            challanStatusOverTime.forEach(entry => {//@ts-ignore
                const monthYear = new Date(entry.challan_date).toLocaleString("en-US", { month: "long", year: "numeric" });
    //@ts-ignore
                if (!monthlyData[monthYear]) {
                    //@ts-ignore
                    monthlyData[monthYear] = { 
                        month: monthYear, 
                        pending: 0, 
                        in_process: 0, 
                        disposed: 0, 
                        not_paid: 0 
                    };
                }

                switch (entry.challan_status) {
                    case "Pending"://@ts-ignore
                        monthlyData[monthYear].pending += entry._count.id;
                        break;
                    case "In Process"://@ts-ignore
                        monthlyData[monthYear].in_process += entry._count.id;
                        break;
                    case "Disposed"://@ts-ignore
                        monthlyData[monthYear].disposed += entry._count.id;
                        break;
                    case "Not Paid"://@ts-ignore
                        monthlyData[monthYear].not_paid += entry._count.id;
                        break;
                }
            });
    
            const formattedData: ChallanStatusEntry[] = Object.values(monthlyData) as ChallanStatusEntry[];
        formattedData.sort((a, b) => new Date(a.month as string).getTime() - new Date(b.month as string).getTime());
        // console.log(formattedData)
                


        // ✅ Format Repeat Offenders Data
        const repeatOffendersData = repeatOffenders.map(offender => ({
            rc_number: offender.rc_number,
            accused_name: offender.accused_name,
            total_challans: offender._count.id
        }));

        let lokAdalatResolved = 0;
        let directPaymentResolved = 0;
        console.log(resolutionData)

        resolutionData.forEach(entry => {
            if (entry.challan_status === "Disposed") {
                if (entry.court_challan) {
                    lokAdalatResolved += entry._count.id;
                } else {
                    directPaymentResolved += entry._count.id;
                }
            }
        });

        const totalResolved = lokAdalatResolved + directPaymentResolved;
        const lokAdalatSuccessRate = totalResolved ? ((lokAdalatResolved / totalResolved) * 100).toFixed(2) : "0";
        const directPaymentSuccessRate = totalResolved ? ((directPaymentResolved / totalResolved) * 100).toFixed(2) : "0";

        const challanResolutionSuccessRate = [
            ["Resolution Method", "Challans Resolved", "Success Rate"],
            ["Lok Adalat", lokAdalatResolved, `${lokAdalatSuccessRate}%`],
            ["Direct Payment", directPaymentResolved, `${directPaymentSuccessRate}%`],
            ["Total", totalResolved, "100%"]
        ];





        // ✅ Prepare Data for Excel
        const workbook = xlsx.utils.book_new();
//@ts-ignore
        function addSheet(sheetName, headers, data) {
            const worksheet = xlsx.utils.aoa_to_sheet([headers, ...data.map(Object.values)]);
            worksheet["!cols"] = headers.map(() => ({ wch: 20 })); // Auto column width
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Ensure sheet name is within 31 chars
        }

        // ✅ Add Sheets with Data
        addSheet("Pending Fines", ["Type", "Amount"], [
            ["Court", courtPending._sum.amount || 0],
            ["Online", onlinePending._sum.amount || 0],
            ["Total", (courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)]
        ]);
        addSheet("Top 5 States", ["State", "Total Challans"], topStates.map(state => [state.state, state._count.id]));
      

        addSheet("Overall Challan Status", ["Status", "Unique Vehicle Count", "No of Challan", "Amount"],//@ts-ignore
            overallChallanStatus.map(status => [status.challan_status, status._count.id, status._count.id, `₹${status?._sum?.amount?.toLocaleString()}`])
        );

        addSheet("Pending Challan %", ["Type", "Value"], [
            ["Total Pending Challans", (courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)],
            ["Court Challan Pending", courtPending._sum.amount || 0],
            ["Online Challan Pending", onlinePending._sum.amount || 0],
            ["Court Challan Percentage", `${((courtPending._sum.amount || 0) / ((courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)) * 100).toFixed(2)}%`],
            ["Online Challan Percentage", `${((onlinePending._sum.amount || 0) / ((courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)) * 100).toFixed(2)}%`]
        ]);


        addSheet("Avg Challan Per Truck", ["RC Number", "Avg Challan Amount"],//@ts-ignore
            averageChallanPerTruckData.map(truck => [truck.rc_number, Math.floor(truck._avg.amount)])
        );

        addSheet("Repeat Offenders", ["RC Number", "Accused Name", "Total Challans"], repeatOffendersData.map(offender => [
            offender.rc_number,
            offender.accused_name,
            offender.total_challans
        ]));
        addSheet("Top drivers by challan value", ["rc_number", "Accused Name", "Total Challans amount"],  topDriversByChallanValue.map(driver => ({
            rc_number: driver.rc_number,
            accused_name: driver.accused_name,
            total_challan_amount_value: driver._sum.amount || 0
        })),);





        addSheet("Highest & Lowest Challan", ["Type", "RC Number", "Accused Name", "Challan Number", "Challan Date", "Amount"], [
            ["Highest", highestChallan?.rc_number, highestChallan?.accused_name, highestChallan?.challan_number, highestChallan?.challan_date, `₹${highestChallan?.amount?.toLocaleString()}`],
            ["Lowest", lowestChallan?.rc_number, lowestChallan?.accused_name, lowestChallan?.challan_number, lowestChallan?.challan_date, `₹${lowestChallan?.amount?.toLocaleString()}`]
        ]);
  
        addSheet("Resolved vs Pending", ["Month", "Pending Challans", "In Process", "Disposed", "Not Paid"],  
            formattedData.map(entry => [  // ✅ Remove spread `...`
                entry.month, 
                entry.pending, 
                entry.in_process, 
                entry.disposed, 
                entry.not_paid
            ])
        );
        





        addSheet("Pending Duration Analysis", ["RC Number", "Accused Name", "Challan Number", "Challan Date", "Days Pending"],
            pendingDurationData
        );

        addSheet("Peak Violation months", ["month","total_violations"],
            sortedPeakViolations
        );


        addSheet("Challan Resolution Success", ["Resolution Method", "Challans Resolved", "Success Rate"], challanResolutionSuccessRate);



        // ✅ Save File
        const filePath = path.join(__dirname, "Challan_Report.xlsx");
        xlsx.writeFile(workbook, filePath);

        // ✅ Send JSON Response + Excel File as Download
        res.download(filePath, "Challan_Report.xlsx", (err) => {
            if (err) {
                console.error("File Download Error:", err);
                res.status(500).json({ success: false, message: "Error generating Excel file" });
            }
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching analytics data", error });
    }
});


app.listen(4000, () => {
    console.log(`Server is running on port ${4000}`);
});
module.exports = app;