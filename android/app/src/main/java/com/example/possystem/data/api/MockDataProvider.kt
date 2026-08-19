package com.example.possystem.data.api

import com.example.possystem.data.model.*

object MockDataProvider {

    fun getSampleProducts(): List<Product> = listOf(
        Product("120", "100 LPD ETC SPC SOLAR WATER HEATER", "SWH-100", 18500.0, 12, "Solar Water Heaters", "SUP-01", "100L Solar Water Heater system with glass lining tank."),
        Product("121", "150 LPD ETC SPC SOLAR WATER HEATER", "SWH-150", 24000.0, 8, "Solar Water Heaters", "SUP-01", "High efficiency 150L SWH for home use."),
        Product("122", "200 LPD ETC SPC SOLAR WATER HEATER", "SWH-200", 31000.0, 4, "Solar Water Heaters", "SUP-01", "200L SWH ideal for 4-6 members family."),
        Product("123", "200 LPD PRESSURIZED SOLAR WATER HEATER", "SWH-200P", 42000.0, 2, "Solar Water Heaters", "SUP-01", "Pressurized SWH suitable for pressure pumps."),
        Product("89", "24x72 PENTAIRE VESSEL", "RO-VES-2472", 14500.0, 15, "RO System Components", "SUP-02", "Heavy duty FRP vessel for commercial RO plants."),
        Product("100", "INOXE 220 RESIN", "RO-RES-220", 3800.0, 25, "RO System Components", "SUP-02", "Cation exchange resin 25L bag."),
        Product("108", "4000 LPH HM SCALENOR", "RO-SCL-4K", 6500.0, 6, "RO System Components", "SUP-02", "Antiscalant dosing pump controller."),
        Product("110", "CONTROL PANEL BIG", "CP-BIG-01", 8500.0, 5, "RO System Components", "SUP-03", "Automatic RO plant controller with digital display."),
        Product("129", "58x1800 SOLAR TUBE", "TUBE-581800", 650.0, 40, "Solar Water Heaters", "SUP-01", "Three target borosilicate glass vacuum tube."),
        Product("134", "TUBE HOLDERS", "ACC-HOLDER", 45.0, 150, "Solar Water Heaters", "SUP-01", "Bottom plastic cap for vacuum tube support.")
    )

    fun getSampleCustomers(): List<Customer> = listOf(
        Customer("CUST-01", "Raju Garu", "+91 98765 43210", "raju@ventures.com", "Banjara Hills, Hyderabad", 125000.0, 0.0),
        Customer("CUST-02", "Srinivas Rao", "+91 91234 56789", "srinivas@ete.in", "Gachibowli, Hyderabad", 48000.0, 5000.0),
        Customer("CUST-03", "Anand Varma", "+91 99887 76655", "anand@solartech.com", "Jubilee Hills, Hyderabad", 89000.0, 0.0),
        Customer("CUST-04", "Kiran Kumar", "+91 94400 11223", "kiran@gmail.com", "Kukatpally, Hyderabad", 32000.0, 2500.0)
    )

    fun getSampleLeads(): List<Lead> = listOf(
        Lead("LD-101", "Vikram Reddy", "vikram@commercial.com", "+91 98490 12345", "Reddy Apartments", "Proposal", 185000.0, "Website", "Needs 5x 200L solar water heaters for residential building."),
        Lead("LD-102", "Suresh Sharma", "suresh@factory.org", "+91 97000 54321", "Sharma Textiles", "Qualified", 350000.0, "Referral", "Requires 10,000 LPH Commercial RO Plant installation."),
        Lead("LD-103", "Mahesh Babu", "mahesh@villas.in", "+91 96111 22334", "Green Meadows", "Contacted", 95000.0, "Direct", "Inquired about softner plant & heat pump."),
        Lead("LD-104", "Pooja Hegde", "pooja@decor.com", "+91 95555 88899", "Decor Studio", "Won", 64000.0, "Exhibition", "Solar water heater installed successfully.")
    )

    fun getSamplePurchases(): List<Purchase> = listOf(
        Purchase("PO-501", "SunPower Solar Ltd", "58x1800 Vacuum Tubes (Box 50)", 2, 50000.0, "Completed", "2026-08-15"),
        Purchase("PO-502", "Pentair Water Tech", "24x72 FRP Vessels", 4, 48000.0, "Completed", "2026-08-18"),
        Purchase("PO-503", "Delta Control Systems", "Big RO Control Panels", 5, 32500.0, "Pending", "2026-08-19")
    )

    fun getSampleProjects(): List<Project> = listOf(
        Project(
            id = "PRJ-01",
            name = "Reddy Apartments 1000L SWH Setup",
            clientName = "Vikram Reddy",
            status = "Active",
            progress = 65,
            budget = 185000.0,
            deadline = "2026-08-30",
            tasks = listOf(
                Task("TSK-1", "PRJ-01", "Site Inspection & Roof Mounting", "Check roof load and sun angle.", "High", "Completed", "Ramesh Tech", "2026-08-10",
                    listOf(Subtask("ST-1", "TSK-1", "Roof measurement", true), Subtask("ST-2", "TSK-1", "Sun exposure mapping", true))),
                Task("TSK-2", "PRJ-01", "Piping & Tank Installation", "Install cold water inlet and hot water manifold.", "High", "In Progress", "Suresh Tech", "2026-08-25",
                    listOf(Subtask("ST-3", "TSK-2", "Mounting frame setup", true), Subtask("ST-4", "TSK-2", "PEX Pipe crimping", false)))
            )
        ),
        Project(
            id = "PRJ-02",
            name = "Sharma Textiles 10,000 LPH RO Plant",
            clientName = "Suresh Sharma",
            status = "Active",
            progress = 30,
            budget = 350000.0,
            deadline = "2026-09-15",
            tasks = listOf(
                Task("TSK-3", "PRJ-02", "FRP Vessel & Resin Loading", "Fill sand, carbon, and cation resin.", "High", "Pending", "Tech Team A", "2026-09-01", emptyList())
            )
        )
    )

    fun getSampleSales(): List<Sale> = listOf(
        Sale("SL-901", "INV-2026-001", "Raju Garu", 24000.0, 1000.0, 23000.0, "UPI", "Paid", "2026-08-19 14:30",
            listOf(SaleItem("121", "150 LPD ETC SPC SOLAR WATER HEATER", 1, 24000.0, 24000.0))),
        Sale("SL-902", "INV-2026-002", "Srinivas Rao", 14500.0, 0.0, 14500.0, "Card", "Paid", "2026-08-19 16:15",
            listOf(SaleItem("89", "24x72 PENTAIRE VESSEL", 1, 14500.0, 14500.0))),
        Sale("SL-903", "INV-2026-003", "Walk-in Customer", 1300.0, 0.0, 1300.0, "Cash", "Paid", "2026-08-19 17:45",
            listOf(SaleItem("129", "58x1800 SOLAR TUBE", 2, 650.0, 1300.0)))
    )

    fun getSampleReports(): ReportSummary = ReportSummary(
        totalRevenue = 412500.0,
        totalSales = 48,
        totalProducts = 139,
        totalCustomers = 34,
        lowStockCount = 5,
        topCategory = "Solar Water Heaters"
    )

    fun getSampleUsers(): List<User> = listOf(
        User("1", "admin", "System Administrator", "admin@sbrpos.com", "admin", true),
        User("2", "sales", "Sales Officer", "sales@sbrpos.com", "user", false),
        User("3", "tech", "Installation Lead", "tech@sbrpos.com", "user", false)
    )
}
