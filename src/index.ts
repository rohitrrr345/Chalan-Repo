import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import express from "express"

import path from "path";
import { ChallanByMonth, PendingChallan, PendingChallanStats, RepeatOffender, TruckAverage, TruckChallan } from "./types/challan";
const app = express()
const prisma = new PrismaClient();

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
async function importExcelData() {
    try {
        // Load the Excel file
        const filePath = path.join(process.cwd(), "data.xlsx");
        console.log(filePath, "file path")
        const workbook = XLSX.readFile("C:\\Users\\Lenovo\\Desktop\\Copy\\data.xlsx"); // Replace with your Excel file
        const sheetName = workbook.SheetNames[2]; // Get first sheet
        const sheet = workbook.Sheets[sheetName]

        // Convert sheet data to JSON
        const jsonData: ChallanEntry[] = XLSX.utils.sheet_to_json(sheet);

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
    } catch (err) {
        console.error("❌ Error importing data:", err);
    } finally {
        // await prisma.$disconnect();
    }
}

// Run the function
importExcelData();

app.get("/pending-challans", async (req, res) => {
    try {
        const pendingChallans = await prisma.challan.findMany({
            where: { challan_status: "Pending" },
        });

        res.json({
            success: true,
            NumberOfPendingChallans: pendingChallans.length,
            data: pendingChallans,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching data", error });
    }
});


app.get("/online-offline-pending-fines", async (req, res) => {
    try {
        // Fetch total pending amount for Court Challans
        const courtPending = await prisma.challan.aggregate({
            _sum: { amount: true },
            where: { challan_status: "Pending", court_challan: true },
        });
        console.log(courtPending)
        // Fetch total pending amount for Online Challans
        const onlinePending = await prisma.challan.aggregate({
            _sum: { amount: true },
            where: { challan_status: "Pending", court_challan: false },
        });
        console.log(onlinePending)
        res.json({
            success: true,
            total_pending_fines: {
                court: courtPending._sum.amount || 0,
                online: onlinePending._sum.amount || 0,
                total: (courtPending._sum.amount || 0) + (onlinePending._sum.amount || 0)
            }
        });
    } catch (error) {
        console.error("❌ Error fetching pending fines:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


app.get("/total-pending-fines-sum", async (req, res) => {
    try {
        const totalPendingAmount = await prisma.challan.aggregate({
            _sum: { amount: true },
            where: { challan_status: "Pending" },
        });
        console.log(totalPendingAmount)
        // Get the total sum or default to 0 if no data
        const totalAmount = totalPendingAmount._sum.amount || 0;

        res.json({ success: true, total_pending_fines: totalAmount });
    } catch (error) {
        console.error("❌ Error fetching pending fines:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.get("/higest-challan-lowest-challan", async (req, res) => {
    try {
        // Find the challan with the highest amount
        const highestChallan = await prisma.challan.findFirst({
            orderBy: { amount: "desc" } // Sort by amount in descending order
        });

        // Find the challan with the lowest amount
        const lowestChallan = await prisma.challan.findFirst({
            orderBy: { amount: "asc" } // Sort by amount in ascending order
        });

        res.json({
            success: true,
            highestChallan: highestChallan || null, // Return null if no data
            lowestChallan: lowestChallan || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching extreme challan amounts",
            error
        });
    }
});
app.get("/topstates-with-most-challans", async (req, res) => {
    try {
        // Find the top 5 states with the most challans
        const topStates = await prisma.challan.groupBy({
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching top states with maximum challans",
            error
        });
    }
});

app.get("/peak-violation-months", async (req, res) => {
    try {
        // Group challans by month and count occurrences
        const peakMonths = await prisma.challan.groupBy({
            by: ["challan_date"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } }
        });

        // Transform data into a structured format
        const monthWiseData: Record<string, number> = {};

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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching peak violation months",
            error
        });
    }
});
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
app.get("/drivers-by-challan-top-5", async (req, res) => {
    try {
        // Group challans by driver and sum total amount
        const driverChallanValues = await prisma.challan.groupBy({
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching drivers by challan value",
            error
        });
    }
});
app.get("/average-challan-per-truck", async (req, res) => {
    try {
        // Fetch all challans with truck details
        const challans = await prisma.challan.findMany({
            select: {
                rc_number: true,
                amount: true // Now `amount` is an integer
            }
        });

        // Type-safe object to store truck totals
        const truckTotals: Record<string, TruckChallan> = {};

        challans.forEach(({ rc_number, amount }) => {
            if (!rc_number) return;
            if (!amount) return;
            if (!truckTotals[rc_number]) {
                truckTotals[rc_number] = { rc_number, totalAmount: 0, count: 0 };
            }

            truckTotals[rc_number].totalAmount += amount; // Sum amounts (Integer)
            truckTotals[rc_number].count += 1; // Count occurrences
        });
        console.log(truckTotals)
        // Convert data into a sorted array with average calculation
        const sortedTrucks: TruckAverage[] = Object.values(truckTotals)
            .map(truck => ({
                rc_number: truck.rc_number,
                average_challan_amount: Math.floor(truck.totalAmount / truck.count) // Ensure integer output
            }))
            .sort((a, b) => b.average_challan_amount - a.average_challan_amount); // Sort descending

        res.json({
            success: true,
            data: sortedTrucks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error calculating average challan amount per truck",
            error
        });
    }
});

app.get("/challans-by-state-city", async (req, res) => {
    try {
        // Group by State & City (Challan Place)
        const challanCounts = await prisma.challan.groupBy({
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
    } catch (error) {
        console.error("❌ Error fetching violation hotspots:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
app.get("/challans-by-month", async (req, res) => {
    try {
        // Fetch all challans with date
        const challans = await prisma.challan.findMany({
            select: {
                challan_date: true
            }
        });

        // Group challans by Month/Year
        const monthlyChallans: Record<string, ChallanByMonth> = {};

        challans.forEach(({ challan_date }) => {
            if (!challan_date) return; // Skip if date is missing

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
        const sortedData: ChallanByMonth[] = Object.values(monthlyChallans)
            .sort((a, b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());

        res.json({
            success: true,
            data: sortedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching challans by month/year",
            error
        });
    }
});
app.get("/pending-duration-analysis", async (req, res) => {
    try {
        // Fetch all pending challans
        const pendingChallans = await prisma.challan.findMany({
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
        const result: PendingChallan[] = pendingChallans.map(challan => {
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching pending duration analysis",
            error
        });
    }
});

app.get("/repeat-offenders", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let whereCondition: any = {};

        if (startDate && endDate) {
            whereCondition.challan_date = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        // Find repeat offenders (drivers with more than one challan)
        const offenders = await prisma.challan.groupBy({
            by: ["rc_number", "accused_name"],
            _count: { id: true },
            where: whereCondition,
            having: { id: { _count: { gt: 1 } } }, // Only include drivers with more than one challan
            orderBy: { _count: { id: "desc" } }
        });

        // Format response data
        //@ts-ignore
        const result: RepeatOffender[] = offenders.map(offender => ({
            rc_number: offender.rc_number,
            accused_name: offender.accused_name,
            total_challans: offender._count.id
        }));

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching repeat offenders",
            error
        });
    }
});
//@ts-ignore
app.get("/challans-by-vehicle/:rc_number", async (req, res) => {
    try {
        const { rc_number } = req.params;

        if (!rc_number) {
            return res.status(400).json({
                success: false,
                message: "Vehicle registration number (rc_number) is required."
            });
        }

        // Fetch all challans for the given vehicle registration number
        const challans = await prisma.challan.findMany({
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching challans by vehicle registration number",
            error
        });
    }
});
app.get("/challan-pending-percentage", async (req, res) => {
    try {
        // Fetch total pending challans
        const totalPending = await prisma.challan.count({
            where: { challan_status: "Pending" }
        });

        // Fetch pending court challans
        const courtPending = await prisma.challan.count({
            where: { challan_status: "Pending", court_challan: true }
        });

        // Fetch pending online challans
        const onlinePending = totalPending - courtPending;

        // Calculate percentages
        const courtPercentage = totalPending ? (courtPending / totalPending) * 100 : 0;
        const onlinePercentage = totalPending ? (onlinePending / totalPending) * 100 : 0;

        const result: PendingChallanStats = {
            total_pending_challans: totalPending,
            court_challan_pending: courtPending,
            online_challan_pending: onlinePending,
            court_challan_percentage: parseFloat(courtPercentage.toFixed(2)),
            online_challan_percentage: parseFloat(onlinePercentage.toFixed(2))
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching pending challan percentage",
            error
        });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
});