  
  //
  export function excelSerialToJSDate(serial:number) {
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
export function excelSerialToJSDateTime(serial:number) {
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
