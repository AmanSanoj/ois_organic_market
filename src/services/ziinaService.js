const ZIINA_API_URL = process.env.VITE_ZIINA_API_URL || 'https://api.ziina.com/v1';
const ZIINA_API_KEY = process.env.VITE_ZIINA_API_KEY;

export class ZiinaService {
  constructor() {
    if (!ZIINA_API_KEY) {
      console.error('Ziina API key is not configured');
    }
  }

  async createPaymentRequest({
    amount,
    currency = 'AED',
    customerEmail,
    customerName,
    customerPhone,
    orderId,
    description
  }) {
    try {
      const response = await fetch(`${ZIINA_API_URL}/payment-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZIINA_API_KEY}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to smallest currency unit (fils)
          currency,
          customer: {
            email: customerEmail,
            name: customerName,
            phone: customerPhone
          },
          reference: orderId,
          description,
          success_url: `${window.location.origin}/payment/success`,
          failure_url: `${window.location.origin}/payment/failure`,
          cancel_url: `${window.location.origin}/payment/cancel`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment request');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Ziina payment request:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentRequestId) {
    try {
      const response = await fetch(`${ZIINA_API_URL}/payment-requests/${paymentRequestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ZIINA_API_KEY}`,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get payment status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
}

export default new ZiinaService();
