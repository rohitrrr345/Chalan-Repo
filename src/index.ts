import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

// Load environment variables
// dotenv.config();
import path from "path";

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
interface ChallanEntry {
    rc_number: string;
    chassis_number?: string; // Optional
    challan_number: string;
    offense_details: string;
    challan_place: string;
    challan_date: () => string;
    state: string;
    rto: string;
    accused_name: string;
    amount: string;
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
        const workbook = XLSX.readFile("C:\\Users\\Lenovo\\Desktop\\Copy\\Challan\\src\\data.xlsx"); // Replace with your Excel file
        const sheetName = workbook.SheetNames[2]; // Get first sheet
        const sheet = workbook.Sheets[sheetName]
     
        // Convert sheet data to JSON
        const jsonData:ChallanEntry[] = XLSX.utils.sheet_to_json(sheet);

        // console.log(jsonData,"json data");
        // Loop through each row in the sheet
        const data = jsonData.map(async (entry) => {
            console.log(entry,"entry");
        });

        let count = 0;
            // Create a new Challan entry
        for (const entry of jsonData) {
            count++;
            console.log(count,"entry");
            await prisma.challan.create({
                data: {
                    rc_number: entry?.rc_number,
                    chassis_number: entry?.chassis_number?.toString(),
                    challan_number: entry?.challan_number.toString(),
                    offense_details: entry?.offense_details,
                    challan_place: entry?.challan_place,
                    //@ts-ignore
                    challan_date: entry?.challan_date ?excelSerialToJSDate(entry?.challan_date).toString(): "null",         
                    state: entry?.state,
                    rto: entry?.rto,
                    accused_name: entry?.accused_name,
                    amount: entry.amount?.toString(),
                    challan_status: entry?.challan_status,
                    //@ts-ignore
                    challan_date_time: entry?.challan_date_time ? excelSerialToJSDateTime(entry.challan_date_time).toString() : "null",
                    upstream_code: entry?.upstream_code?.toString(),
                    court_challan: entry?.court_challan,
                    comment: entry?.comment?.toString(),
                    //@ts-ignore
                    state_name: entry["State Name"].toString()
                },
            });
        }
        // await prisma.challan.deleteMany();




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



