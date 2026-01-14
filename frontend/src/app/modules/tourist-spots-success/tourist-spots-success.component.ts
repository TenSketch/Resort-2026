import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tourist-spots-success',
  templateUrl: './tourist-spots-success.component.html',
  styleUrls: ['./tourist-spots-success.component.scss']
})
export class TouristSpotsSuccessComponent implements OnInit {
  transactionData: any = null;
  transactionId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.transactionId = params['transactionId'];
      this.loadTransactionData();
    });
  }

  private loadTransactionData(): void {
    const storedData = localStorage.getItem('touristSpotsTransaction');
    if (storedData) {
      this.transactionData = JSON.parse(storedData);
      
      // Verify transaction ID matches
      if (this.transactionData.transactionId !== this.transactionId) {
        this.router.navigate(['/home']);
        return;
      }
    } else {
      // No transaction data found, redirect to home
      this.router.navigate(['/home']);
    }
  }

  getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'upi': 'UPI',
      'card': 'Card Payment',
      'netbanking': 'Net Banking'
    };
    return methods[method] || method;
  }

  downloadReceipt(): void {
    if (!this.transactionData) return;

    // Create a simple receipt content
    const receiptContent = this.generateReceiptContent();
    
    // Create and download the receipt
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tourist-spots-receipt-${this.transactionId}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateReceiptContent(): string {
    const data = this.transactionData;
    let content = `
VANAVIHARI - TOURIST SPOTS BOOKING RECEIPT
==========================================

Transaction ID: ${data.transactionId}
Payment Date: ${new Date(data.paymentDate).toLocaleString()}
Payment Method: ${this.getPaymentMethodName(data.payment.method)}

CUSTOMER INFORMATION:
--------------------
Name: ${data.customer.fullName}
Email: ${data.customer.email}
Phone: ${data.customer.phone}
Visit Date: ${new Date(data.customer.visitDate).toLocaleDateString()}

BOOKED SPOTS:
-------------
`;

    data.booking.spots.forEach((spot: any, index: number) => {
      content += `
${index + 1}. ${spot.name}, ${spot.location}
   Adults: ${spot.counts.adults}, Children: ${spot.counts.children}
   Vehicles: ${spot.counts.vehicles}, Cameras: ${spot.counts.cameras}
   Amount: ₹${spot.total}
`;
    });

    content += `
PAYMENT BREAKDOWN:
------------------
Subtotal: ₹${data.payment.breakdown.subtotal}
Service Charges: ₹${data.payment.breakdown.serviceCharges}
GST (18%): ₹${data.payment.breakdown.gst}
Total Amount: ₹${data.payment.breakdown.total}

Thank you for choosing Vanavihari!
For queries, contact: +91 7382151617 or info@vanavihari.com
`;

    return content;
  }

  sendEmailConfirmation(): void {
    if (!this.transactionData) return;

    // Simulate sending email confirmation
    const button = document.querySelector('.btn-outline-secondary') as HTMLButtonElement;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Sending...';
      button.disabled = true;

      setTimeout(() => {
        button.innerHTML = '<i class="fa-solid fa-check me-2"></i>Sent!';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      }, 2000);
    }
  }
}