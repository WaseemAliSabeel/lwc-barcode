import { LightningElement, track } from "lwc";
import qrcode from "./qrcode.js";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getBarcodeScanner } from "lightning/mobileCapabilities";

export default class WMobileScanAndCreate extends LightningElement {
  myScanner;
  scanButtonDisabled = false;
  scannedBarcode = "";
  scannedBarcodeType = "";
  @track strContent = "";

  // When component is initialized, detect whether to enable Scan button or not
  connectedCallback() {
    this.myScanner = getBarcodeScanner();
    if (this.myScanner == null || !this.myScanner.isAvailable()) {
      this.scanButtonDisabled = true;
    }
  }

  handleBeginScanClick(event) {
    // Reset scannedBarcode to empty string before starting new scan
    this.scannedBarcode = "";

    // Make sure BarcodeScanner is available before trying to use it
    // Note: We disable the Scan button if there's no BarcodeScanner (like in Desktop experience)
    if (this.myScanner != null && this.myScanner.isAvailable()) {
      // Scanning Option this.myScanner.barcodeTypes.UPC_A  somehow gives an error of not being able to open the mobile camera in Salesforce Android App.
      //  Hence, specifying all other 10 supported Barcode Types - https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_lightning_barcodescanner_constants
      const scanningOptions = {
        barcodeTypes: [
          this.myScanner.barcodeTypes.QR,
          this.myScanner.barcodeTypes.DATA_MATRIX,
          this.myScanner.barcodeTypes.EAN_13,
          this.myScanner.barcodeTypes.EAN_8,
          this.myScanner.barcodeTypes.PDF_417,
          this.myScanner.barcodeTypes.CODE_128,
          this.myScanner.barcodeTypes.CODE_39,
          this.myScanner.barcodeTypes.CODE_93,
          this.myScanner.barcodeTypes.ITF,
          this.myScanner.barcodeTypes.UPC_E
        ],
        instructionText: "Scan any 10 supported barcode types",
        successText: "Scanning complete."
      };

      this.myScanner
        .beginCapture(scanningOptions)
        .then((result) => {
          //Display the scanned barcode value & barcode type in the UI
          this.scannedBarcode = result.value;
          this.scannedBarcodeType = result.type;
        })
        .catch((error) => {
          if (error.code == "userDismissedScanner") {
            // User clicked Cancel - No need to show a Toast. Proceed to end capture.
            // this.dispatchEvent(
            //   new ShowToastEvent({
            //     title: "Scanning Cancelled",
            //     message: "You cancelled the scanning session.",
            //     mode: "sticky"
            //   })
            // );
          } else {
            // Inform the user we ran into something unexpected
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Barcode Scanner Error",
                message: "Problem scanning the barcode: " + error.message,
                variant: "error",
                mode: "sticky"
              })
            );
          }
        })
        .finally(() => {
          // Clean up by ending capture, whether completed successfully or had an error
          this.myScanner.endCapture();
        });
    } else {
      // BarcodeScanner is not available
      // Not running on hardware with a camera, or some other context issue
      // Let user know they need to use a mobile phone with a camera
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Barcode Scanner Is Not Available",
          message: "Try again from the Salesforce app on a mobile device.",
          variant: "warning"
        })
      );
    }
  }

  // Capture User-entered input and update in a tracked variable
  handleInputChange(event) {
    this.strContent = event.detail.value;
  }

  // Generate QR code with the entered Content
  generateQRCode() {
    if (this.strContent) {
      const qrCodeGenerated = new qrcode(0, "H");
      qrCodeGenerated.addData(this.strContent);
      qrCodeGenerated.make();
      let element = this.template.querySelector(".qrcodediv");
      element.innerHTML = qrCodeGenerated.createSvgTag({});
    }
  }

  // Handle reset button click to clear out the user-entered content
  resetContent() {
    this.strContent = "";
  }
}
