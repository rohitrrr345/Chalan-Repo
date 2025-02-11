-- CreateTable
CREATE TABLE "Challan" (
    "id" SERIAL NOT NULL,
    "rc_number" TEXT NOT NULL,
    "chassis_number" TEXT NOT NULL,
    "challan_number" TEXT NOT NULL,
    "offense_details" TEXT NOT NULL,
    "challan_place" TEXT NOT NULL,
    "challan_date" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "rto" TEXT NOT NULL,
    "accused_name" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "challan_status" TEXT NOT NULL,
    "challan_date_time" TEXT NOT NULL,
    "upstream_code" TEXT NOT NULL,
    "court_challan" BOOLEAN NOT NULL,
    "comment" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challan_pkey" PRIMARY KEY ("id")
);
