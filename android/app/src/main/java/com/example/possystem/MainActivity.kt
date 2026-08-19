package com.example.possystem

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.possystem.theme.POSSystemTheme
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning

class MainActivity : ComponentActivity() {
  
  companion object {
    private var instance: MainActivity? = null
    
    fun startBarcodeScan(onScanResult: (String) -> Unit) {
      val activity = instance ?: return
      val options = GmsBarcodeScannerOptions.Builder()
        .setBarcodeFormats(com.google.mlkit.vision.barcode.common.Barcode.FORMAT_ALL_FORMATS)
        .enableAutoZoom()
        .build()
      
      val scanner = GmsBarcodeScanning.getClient(activity, options)
      scanner.startScan()
        .addOnSuccessListener { barcode ->
          val rawValue = barcode.rawValue
          if (rawValue != null) {
            Toast.makeText(activity, "Scanned: $rawValue", Toast.LENGTH_SHORT).show()
            onScanResult(rawValue)
          }
        }
        .addOnFailureListener { e ->
          Toast.makeText(activity, "Scan failed: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    instance = this

    enableEdgeToEdge()
    setContent {
      POSSystemTheme { Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { MainNavigation() } }
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    if (instance == this) {
      instance = null
    }
  }
}
