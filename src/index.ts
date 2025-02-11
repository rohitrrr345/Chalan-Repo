import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import express from "express"

// Load environment variables
// dotenv.config();
import path from "path";
import { TruckAverage, TruckChallan } from "./types/challan";
const app=express()
//@ts-ignore

function excelSerialToJSDate(serial) {
    if (!serial || isNaN(serial)) return null; // Handle missing/invalid values

    // Convert Excel serial number to milliseconds
    const excelEpoch = new Date(1900, 0, 1);
    const milliseconds = (serial - 1) * 86400000; // Convert days to ms

    // Fix Excel leap year bug (Excel incorrectly includes Feb 29, 1900)
    let finalDate = new Date(excelEpoch.getTime() + milliseconds);
    if (serial >= 60) {
        finalDate.setDate(finalDate.getDate() - 1);
    }

    // Format the date as MM/DD/YYYY
    const formattedDate = `${
        (finalDate.getMonth() + 1).toString().padStart(2, "0") // Month (1-based)
    }/${
        finalDate.getDate().toString().padStart(2, "0") // Day
    }/${
        finalDate.getFullYear() // Year
    }`;

    return formattedDate;
}

//@ts-ignore
function excelSerialToJSDateTime(serial) {
    if (!serial || isNaN(serial)) return null; // Handle missing/invalid values

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
    const formattedDate = `${
        (finalDate.getMonth() + 1).toString().padStart(2, "0") // Month (1-based)
    }/${
        finalDate.getDate().toString().padStart(2, "0") // Day
    }/${
        finalDate.getFullYear() // Year
    } ${
        finalDate.getHours().toString().padStart(2, "0") // Hours
    }:${
        finalDate.getMinutes().toString().padStart(2, "0") // Minutes
    }:${
        finalDate.getSeconds().toString().padStart(2, "0") // Seconds
    }`;

    return formattedDate;
}

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
console.log(filePath,"file path")   
        const workbook = XLSX.readFile("C:\\Users\\Lenovo\\Desktop\\Copy\\data.xlsx"); // Replace with your Excel file
        const sheetName = workbook.SheetNames[2]; // Get first sheet
        const sheet = workbook.Sheets[sheetName]
     
        // Convert sheet data to JSON
        const jsonData:ChallanEntry[] = XLSX.utils.sheet_to_json(sheet);

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

        res.json({ success: true,
            NumberOfPendingChallans: pendingChallans.length,
            data: pendingChallans,   
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching data", error });
    }
});
// // ✅ API Route: Get Total Pending Challan Amount (In Courts & Online)
app.get("/court", async (req, res) => {

    try {

        const pendingChallans = await prisma.challan.findMany({
            where: { court_challan: true },
        });
        res.json({
            success: true,
          data:{
pendingChallans
          },
          NumberOfCourtChallans: pendingChallans.length,

          
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error calculating total pending amount", error });
    }
});


app.get("/higest", async (req, res) => {
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
app.get("/topstates", async (req, res) => {
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
app.get("/top-offenders", async (req, res) => {
    try {
        // Find drivers with the highest number of challans
        const topOffenders = await prisma.challan.groupBy({
            by: ["rc_number", "accused_name"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5 // Limit to top 5 offenders
        });

        res.json({
            success: true,
            topOffenders: topOffenders.map(offender => ({
                rc_number: offender.rc_number,
                accused_name: offender.accused_name,
                total_challans: offender._count.id
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching top offenders",
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
app.get("/drivers-by-challan-value", async (req, res) => {
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


app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
  });