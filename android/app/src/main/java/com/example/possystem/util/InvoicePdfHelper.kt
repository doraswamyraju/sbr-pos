package com.example.possystem.util

import android.content.Context
import android.content.Intent
import android.graphics.*
import android.graphics.pdf.PdfDocument
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import android.os.Bundle
import android.os.ParcelFileDescriptor
import androidx.core.content.FileProvider
import com.example.possystem.data.model.Sale
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

object InvoicePdfHelper {

    fun generateA4InvoicePdf(context: Context, sale: Sale): File {
        val pdfDocument = PdfDocument()

        // Standard A4 Dimensions in Points (72 dpi): 595 x 842
        val pageWidth = 595
        val pageHeight = 842
        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas

        val paint = Paint().apply { isAntiAlias = true }
        val textPaint = Paint().apply { isAntiAlias = true }

        // Header Background Banner
        paint.color = Color.rgb(30, 64, 175) // Primary Blue
        canvas.drawRect(0f, 0f, pageWidth.toFloat(), 90f, paint)

        // Company Title
        textPaint.color = Color.WHITE
        textPaint.textSize = 20f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("SRI BALAJI RENEWABLES POS", 30f, 40f, textPaint)

        textPaint.textSize = 10f
        textPaint.typeface = Typeface.DEFAULT
        canvas.drawText("Main Road, Commercial Center • Phone: +91 99999 99999", 30f, 60f, textPaint)
        canvas.drawText("Solar & Water Management Solutions", 30f, 75f, textPaint)

        // Invoice Header Details Box (Right Aligned in Top Banner)
        textPaint.color = Color.WHITE
        textPaint.textSize = 14f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        val invTitle = "INVOICE #${sale.invoiceNo}"
        val invTitleWidth = textPaint.measureText(invTitle)
        canvas.drawText(invTitle, pageWidth - 30f - invTitleWidth, 40f, textPaint)

        textPaint.textSize = 10f
        textPaint.typeface = Typeface.DEFAULT
        val dateStr = "Date: ${sale.date}"
        val dateWidth = textPaint.measureText(dateStr)
        canvas.drawText(dateStr, pageWidth - 30f - dateWidth, 60f, textPaint)

        val payStr = "Payment: ${sale.paymentMethod}"
        val payWidth = textPaint.measureText(payStr)
        canvas.drawText(payStr, pageWidth - 30f - payWidth, 75f, textPaint)

        // Bill To Section Box
        paint.color = Color.rgb(248, 250, 252) // Light Gray
        canvas.drawRoundRect(30f, 110f, (pageWidth - 30).toFloat(), 170f, 8f, 8f, paint)

        paint.color = Color.rgb(226, 232, 240)
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 1f
        canvas.drawRoundRect(30f, 110f, (pageWidth - 30).toFloat(), 170f, 8f, 8f, paint)

        paint.style = Paint.Style.FILL
        textPaint.color = Color.rgb(30, 41, 59)
        textPaint.textSize = 11f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("Billed To:", 45f, 130f, textPaint)

        textPaint.textSize = 12f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText(sale.customerName ?: "Walk-in Customer", 45f, 150f, textPaint)

        textPaint.textSize = 10f
        textPaint.typeface = Typeface.DEFAULT
        textPaint.color = Color.rgb(100, 116, 139)
        canvas.drawText("Status: ${sale.paymentStatus}", (pageWidth - 180).toFloat(), 150f, textPaint)

        // Table Header
        val startY = 195f
        paint.color = Color.rgb(241, 245, 249)
        canvas.drawRect(30f, startY, (pageWidth - 30).toFloat(), startY + 28f, paint)

        textPaint.color = Color.rgb(51, 65, 85)
        textPaint.textSize = 10f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)

        canvas.drawText("#", 40f, startY + 18f, textPaint)
        canvas.drawText("Item Description", 70f, startY + 18f, textPaint)
        canvas.drawText("Qty", 360f, startY + 18f, textPaint)
        canvas.drawText("Price (₹)", 430f, startY + 18f, textPaint)
        canvas.drawText("Total (₹)", 510f, startY + 18f, textPaint)

        var currentY = startY + 28f
        textPaint.typeface = Typeface.DEFAULT
        textPaint.color = Color.rgb(30, 41, 59)

        // Table Rows
        sale.items.forEachIndexed { index, item ->
            // Row bottom line
            paint.color = Color.rgb(241, 245, 249)
            paint.style = Paint.Style.STROKE
            canvas.drawLine(30f, currentY + 24f, (pageWidth - 30).toFloat(), currentY + 24f, paint)
            paint.style = Paint.Style.FILL

            canvas.drawText("${index + 1}", 40f, currentY + 16f, textPaint)
            
            // Truncate long item names if needed
            var name = item.productName
            if (name.length > 40) name = name.substring(0, 37) + "..."
            canvas.drawText(name, 70f, currentY + 16f, textPaint)

            canvas.drawText("${item.quantity}", 365f, currentY + 16f, textPaint)
            canvas.drawText(String.format("%.2f", item.price), 430f, currentY + 16f, textPaint)
            canvas.drawText(String.format("%.2f", item.total), 510f, currentY + 16f, textPaint)

            currentY += 28f
        }

        // Summary Calculations (Right aligned)
        currentY += 15f

        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRoundRect((pageWidth - 250).toFloat(), currentY, (pageWidth - 30).toFloat(), currentY + 110f, 8f, 8f, paint)

        paint.color = Color.rgb(226, 232, 240)
        paint.style = Paint.Style.STROKE
        canvas.drawRoundRect((pageWidth - 250).toFloat(), currentY, (pageWidth - 30).toFloat(), currentY + 110f, 8f, 8f, paint)
        paint.style = Paint.Style.FILL

        textPaint.color = Color.rgb(71, 85, 105)
        textPaint.textSize = 10f
        canvas.drawText("Subtotal:", (pageWidth - 235).toFloat(), currentY + 22f, textPaint)
        canvas.drawText("₹${String.format("%.2f", sale.totalAmount)}", (pageWidth - 100).toFloat(), currentY + 22f, textPaint)

        if (sale.discount > 0) {
            textPaint.color = Color.rgb(220, 38, 38)
            canvas.drawText("Discount:", (pageWidth - 235).toFloat(), currentY + 42f, textPaint)
            canvas.drawText("-₹${String.format("%.2f", sale.discount)}", (pageWidth - 100).toFloat(), currentY + 42f, textPaint)
        }

        textPaint.color = Color.rgb(71, 85, 105)
        canvas.drawText("Payment Method:", (pageWidth - 235).toFloat(), currentY + 62f, textPaint)
        canvas.drawText(sale.paymentMethod, (pageWidth - 100).toFloat(), currentY + 62f, textPaint)

        // Divider in summary
        paint.color = Color.rgb(30, 64, 175)
        paint.strokeWidth = 1.5f
        canvas.drawLine((pageWidth - 235).toFloat(), currentY + 75f, (pageWidth - 45).toFloat(), currentY + 75f, paint)

        textPaint.color = Color.rgb(30, 64, 175)
        textPaint.textSize = 13f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("Total Paid:", (pageWidth - 235).toFloat(), currentY + 95f, textPaint)
        canvas.drawText("₹${String.format("%.2f", sale.finalAmount)}", (pageWidth - 100).toFloat(), currentY + 95f, textPaint)

        // Footer
        textPaint.color = Color.rgb(148, 163, 184)
        textPaint.textSize = 9f
        textPaint.typeface = Typeface.DEFAULT
        val footerText = "Thank you for your business! • Generated by Sri Balaji Renewables POS"
        val footerWidth = textPaint.measureText(footerText)
        canvas.drawText(footerText, (pageWidth - footerWidth) / 2f, (pageHeight - 35).toFloat(), textPaint)

        pdfDocument.finishPage(page)

        // Save PDF to cache directory
        val outputDir = File(context.cacheDir, "invoices").apply { if (!exists()) mkdirs() }
        val outputFile = File(outputDir, "Invoice_${sale.invoiceNo}.pdf")
        
        try {
            pdfDocument.writeTo(FileOutputStream(outputFile))
        } finally {
            pdfDocument.close()
        }

        return outputFile
    }

    fun shareInvoicePdf(context: Context, sale: Sale) {
        val file = generateA4InvoicePdf(context, sale)
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, "Invoice #${sale.invoiceNo} - Sri Balaji Renewables")
            putExtra(Intent.EXTRA_TEXT, "Attached is the A4 PDF Invoice #${sale.invoiceNo} for your purchase.")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        val chooser = Intent.createChooser(intent, "Share A4 Invoice PDF")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }

    fun printInvoice(context: Context, sale: Sale) {
        val pdfFile = generateA4InvoicePdf(context, sale)
        val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
        val jobName = "SBR_Invoice_${sale.invoiceNo}"

        val printAdapter = object : PrintDocumentAdapter() {
            override fun onLayout(
                oldAttributes: PrintAttributes?,
                newAttributes: PrintAttributes?,
                cancellationSignal: android.os.CancellationSignal?,
                callback: LayoutResultCallback?,
                extras: Bundle?
            ) {
                if (cancellationSignal?.isCanceled == true) {
                    callback?.onLayoutCancelled()
                    return
                }

                val info = PrintDocumentInfo.Builder("Invoice_${sale.invoiceNo}.pdf")
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .setPageCount(1)
                    .build()

                callback?.onLayoutFinished(info, true)
            }

            override fun onWrite(
                pages: Array<out PageRange>?,
                destination: ParcelFileDescriptor?,
                cancellationSignal: android.os.CancellationSignal?,
                callback: WriteResultCallback?
            ) {
                var input: FileInputStream? = null
                var output: FileOutputStream? = null

                try {
                    input = FileInputStream(pdfFile)
                    output = FileOutputStream(destination?.fileDescriptor)

                    val buf = ByteArray(1024)
                    var bytesRead: Int
                    while (input.read(buf).also { bytesRead = it } >= 0) {
                        output.write(buf, 0, bytesRead)
                    }

                    callback?.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
                } catch (e: Exception) {
                    callback?.onWriteFailed(e.message)
                } finally {
                    try { input?.close() } catch (e: Exception) {}
                    try { output?.close() } catch (e: Exception) {}
                }
            }
        }

        val printAttributes = PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
            .setMinMargins(PrintAttributes.Margins(0, 0, 0, 0))
            .build()

        printManager.print(jobName, printAdapter, printAttributes)
    }
}
