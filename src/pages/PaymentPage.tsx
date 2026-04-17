import PaymentButton from '../components/PaymentButton';

const PaymentPage = () => {
  const userId = "123"; 

  const plans = [
    {
      name: 'Basic',
      price: 100,
      description: 'Good for getting started',
      accent: '#3b82f6' // Blue
    },
    {
      name: 'Standard',
      price: 200,
      description: 'Best for regular users',
      accent: '#8b5cf6', // Purple
      popular: true
    },
    {
      name: 'Premium',
      price: 365,
      description: 'Full access & premium features',
      accent: '#ec4899' // Pink
    },
  ];

  return (
    <div style={{ padding: '60px 20px', color: '#fff', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
          Choose Your Plan
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
          Upgrade your experience with our flexible options.
        </p>
      </header>

      <div style={{
        display: 'flex',
        gap: '25px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {plans.map((plan, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${plan.popular ? plan.accent : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '20px',
            padding: '40px 30px',
            width: '300px',
            textAlign: 'center',
            position: 'relative',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {plan.popular && (
              <span style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: plan.accent,
                padding: '4px 15px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}> Most Popular </span>
            )}

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: plan.accent }}>
                {plan.name}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', minHeight: '50px' }}>
                {plan.description}
              </p>
              
              <div style={{ margin: '30px 0' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>${plan.price}</span>
                <span style={{ color: '#64748b' }}>/year</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
               <PaymentButton
                userId={userId}
                items={[{ name: plan.name, price: plan.price, quantity: 1 }]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentPage;