import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Props = {
  onLogin: (user: object) => void;
};

export function OAuthSuccess({ onLogin }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      try {
        localStorage.setItem('token', token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('OAuth User:', payload);
        const userData = {
          id: payload.id,
          email: payload.email,
          name: payload.name
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        onLogin(userData);
        navigate('/home');
      } catch (error) {
        console.error('Failed to process OAuth token:', error);
        navigate('/auth');
      }
    } else {
      navigate('/auth');
    }
  }, []);
    return null;
}
