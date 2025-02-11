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
// import * as XLSX from "xlsx";
// import { PrismaClient } from "@prisma/client";
const XLSX = __importStar(require("xlsx"));
// import dotenv from "dotenv";
// Load environment variables
// dotenv.config();
const path_1 = __importDefault(require("path"));
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
function importExcelData() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            // Load the Excel file
            const filePath = path_1.default.join(process.cwd(), "data.xlsx");
            console.log(filePath, "file path");
            const workbook = XLSX.readFile("C:\\Users\\Lenovo\\Desktop\\Copy\\Challan\\src\\data.xlsx"); // Replace with your Excel file
            const sheetName = workbook.SheetNames[2]; // Get first sheet
            const sheet = workbook.Sheets[sheetName];
            // Convert sheet data to JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            // console.log(jsonData,"json data");
            // Loop through each row in the sheet
            const data = jsonData.map((entry) => __awaiter(this, void 0, void 0, function* () {
                console.log(entry, "entry");
            }));
            let count = 0;
            // Create a new Challan entry
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
                        challan_date: (entry === null || entry === void 0 ? void 0 : entry.challan_date) ? excelSerialToJSDate(entry === null || entry === void 0 ? void 0 : entry.challan_date).toString() : "null",
                        state: entry === null || entry === void 0 ? void 0 : entry.state,
                        rto: entry === null || entry === void 0 ? void 0 : entry.rto,
                        accused_name: entry === null || entry === void 0 ? void 0 : entry.accused_name,
                        amount: (_b = entry.amount) === null || _b === void 0 ? void 0 : _b.toString(),
                        challan_status: entry === null || entry === void 0 ? void 0 : entry.challan_status,
                        //@ts-ignore
                        challan_date_time: (entry === null || entry === void 0 ? void 0 : entry.challan_date_time) ? excelSerialToJSDateTime(entry.challan_date_time).toString() : "null",
                        upstream_code: (_c = entry === null || entry === void 0 ? void 0 : entry.upstream_code) === null || _c === void 0 ? void 0 : _c.toString(),
                        court_challan: entry === null || entry === void 0 ? void 0 : entry.court_challan,
                        comment: (_d = entry === null || entry === void 0 ? void 0 : entry.comment) === null || _d === void 0 ? void 0 : _d.toString(),
                        //@ts-ignore
                        state_name: entry["State Name"].toString()
                    },
                });
            }
            // await prisma.challan.deleteMany();
            const value = excelSerialToJSDate(45620);
            console.log(value);
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
