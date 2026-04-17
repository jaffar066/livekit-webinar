import { useState } from 'react';

type PaymentButtonProps = {
  userId: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
};

const PaymentButton = ({ items, userId }: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, userId }),
      });

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    background: loading 
      ? '#334155' 
      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  return (
    <>
      {/* Injecting a small keyframe for the spinner */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .btn-hover:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45) !important;
            filter: brightness(1.1);
          }
          .btn-hover:active:not(:disabled) {
            transform: translateY(0);
          }
        `}
      </style>

      <button 
        className="btn-hover"
        onClick={handleCheckout} 
        disabled={loading}
        style={buttonStyle}
      >
        {loading ? (
          <>
            <svg 
              style={{ 
                animation: 'spin 1s linear infinite', 
                width: '18px', 
                height: '18px' 
              }} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          'Pay Now'
        )}
      </button>
    </>
  );
};

export default PaymentButton;