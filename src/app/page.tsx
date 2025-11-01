'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { type LoginResult, type UserData, type BannedDetails, loginUser, finalizeQueuedLogin } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/auth/loading-screen';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { BackgroundImage } from '@/components/auth/background-image';
import { BannedScreen } from '@/components/auth/banned-screen';
import { PermissionNotice } from '@/components/auth/permission-notice';
import { ServerErrorScreen } from '@/components/auth/server-error-screen';
import { QuickLoginForm } from '@/components/auth/quick-login-form';
import { colorMap } from '@/components/auth/quick-color-dialog';
import { EmergencyBanner } from '@/components/auth/emergency-banner';
import { AiLoaderScreen } from '@/components/auth/ai-loader-screen';
import { DeactivatedScreen } from '@/components/auth/deactivated-screen';
import { LoginQueueScreen } from '@/components/auth/login-queue-screen';
import { AppSoldScreen } from '@/components/auth/app-sold-screen';

type AppState = 'permission' | 'loading' | 'auth' | 'quickLogin' | 'loggedIn' | 'banned' | 'serverError' | 'crashed' | 'deactivated' | 'inQueue' | 'appSold';
type AuthMode = 'login' | 'signup';

export interface LoginUIState {
  title: string;
  subtitle: string;
  buttonText: string;
  theme: 'dark' | 'light';
  textColor?: string;
  glowColor?: string;
  shake: boolean;
}

const LoggedInScreen: FC<{ user: UserData; onLogout: () => void }> = ({ user, onLogout }) => {
  const [message, setMessage] = useState('Login successful. Preparing your dashboard...');

  useEffect(() => {
    if (user) {
      const websites = [
        'https://urabitcoins.netlify.app',
        'https://openboxpro.netlify.app',
        'https://chatproura.netlify.app'
      ];
      
      setMessage('Syncing account with other services...');

      // Create hidden iframes to ping the websites
      websites.forEach(baseUrl => {
        const url = `${baseUrl}?username=${encodeURIComponent(user.username)}`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        // Clean up the iframe after it has loaded
        iframe.onload = () => {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        };
      });

      // Redirect after a short delay to allow iframes to load
      setTimeout(() => {
        setMessage('Redirecting...');
        window.location.href = 'file:///android_asset/htmlapp/root/main.html';
      }, 3000); // 3-second delay
    }
  }, [user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-primary">Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p>{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const initialLoginUiState: LoginUIState = {
    title: 'Login',
    subtitle: 'Enter your credentials to access your account.',
    buttonText: 'Login',
    theme: 'dark',
    shake: false,
};

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loggedInUser, setLoggedInUser] = useState<UserData | null>(null);
  const [bannedDetails, setBannedDetails] = useState<BannedDetails | null>(null);
  const [queuedUser, setQueuedUser] = useState<UserData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quickLoginUser, setQuickLoginUser] = useState<UserData | null>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [isHackEffectActive, setIsHackEffectActive] = useState(false);
  const [isLoginBlocked, setIsLoginBlocked] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('URA Networks 2.0');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const router = useRouter();


  const [loginUiState, setLoginUiState] = useState<LoginUIState>(initialLoginUiState);
  
  const handleSetLoginUiState = (newUiState: React.SetStateAction<LoginUIState>) => {
    setLoginUiState(prevState => {
        const newState = typeof newUiState === 'function' ? newUiState(prevState) : newUiState;
        if (typeof window !== 'undefined') {
            localStorage.setItem('loginUiState', JSON.stringify(newState));
        }
        return newState;
    });
  }

  const handleSetName = (newName: string) => {
    setLoadingTitle(newName);
  };

  const setShake = (shake: boolean) => {
    handleSetLoginUiState(prev => ({...prev, shake}));
  }

  useEffect(() => {
    setIsClient(true);
    const noticeAgreed = localStorage.getItem('permissionNoticeAgreed');
    
    // Restore state from localStorage
    const savedLoginUiState = localStorage.getItem('loginUiState');
    if (savedLoginUiState) {
        try {
            setLoginUiState(JSON.parse(savedLoginUiState));
        } catch (e) {
            localStorage.removeItem('loginUiState');
        }
    }
    const savedLoadingTitle = localStorage.getItem('loadingTitle');
    if (savedLoadingTitle) {
        setLoadingTitle(savedLoadingTitle);
    }
    const savedLoginBlocked = localStorage.getItem('isLoginBlocked');
    if (savedLoginBlocked) {
        setIsLoginBlocked(JSON.parse(savedLoginBlocked));
    }
     const savedHackEffect = localStorage.getItem('isHackEffectActive');
    if (savedHackEffect) {
        setIsHackEffectActive(JSON.parse(savedHackEffect));
    }
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    if (savedPrimaryColor && colorMap[savedPrimaryColor]) {
        document.documentElement.style.setProperty('--primary', colorMap[savedPrimaryColor]);
    }
    
    const emergencyMode = localStorage.getItem('emergencyMode') === 'true';
    setIsEmergencyMode(emergencyMode);

    if (!noticeAgreed) {
        setAppState('permission');
    } else {
        setAppState('loading');
    }
  }, []);

  const handlePermissionAgree = () => {
    localStorage.setItem('permissionNoticeAgreed', 'true');
    setAppState('loading');
  }

  const handleLoadingComplete = () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedUsername = localStorage.getItem('username');
    const savedEmail = localStorage.getItem('api');
    const autoOpener = localStorage.getItem('autoOpener') === 'true';
    
    if(rememberMe && savedUsername && savedEmail) {
        setQuickLoginUser({username: savedUsername, email: savedEmail});
        setAutoOpen(autoOpener);
        setAppState('quickLogin');
    } else {
        setAppState('auth');
    }
  };

  const handleLoginResult = (result: LoginResult) => {
    if (result.success && result.data && result.status === 'approved') {
        const user = result.data as UserData;
        window.parent.postMessage({ 
          type: "loginSuccess", 
          username: user.username,
          api: user.email 
        }, "*");
        setLoggedInUser(user);
        setAppState('loggedIn');
    } else if (result.status === 'banned' && result.data) {
        localStorage.setItem("failedKey", "true");
        window.parent.postMessage({ type: "ban" }, "*");
        setBannedDetails(result.data as BannedDetails);
        setAppState('banned');
    } else if (result.status === 'in_queue' && result.data) {
        setQueuedUser(result.data as UserData);
        setAppState('inQueue');
    } else if (result.status === 'error') {
        setAppState('serverError');
    } else if (result.status === 'crashed') {
        setAppState('crashed');
    } else if (result.status === 'deactivated') {
        setAppState('deactivated');
    } else if (result.status === 'app_sold') {
        setAppState('appSold');
    }
    else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('successKey');
    localStorage.removeItem('failedKey');
    setLoggedInUser(null);
    setBannedDetails(null);
    setQueuedUser(null);
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if(rememberMe && quickLoginUser){
        setAppState('quickLogin');
    } else {
        setAppState('auth');
        setAuthMode('login');
    }
    setIsFlipped(false);
  };
  
  const handleExitQuickLogin = () => {
    localStorage.setItem('rememberMe', 'false');
    localStorage.setItem('autoOpener', 'false');
    setQuickLoginUser(null);
    setAppState('auth');
  }

  const toggleAuthMode = () => {
    setIsFlipped(prev => !prev);
    setTimeout(() => {
      setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
    }, 250);
  }

  const handleFinalLogin = async (user: UserData) => {
    const result = await finalizeQueuedLogin(user);
    handleLoginResult(result);
  };

  
  const CurrentScreen = () => {
    if (!isClient) {
      return null;
    }
    switch (appState) {
      case 'permission':
        return <PermissionNotice onAgree={handlePermissionAgree} />;
      case 'loading':
        return <LoadingScreen onComplete={handleLoadingComplete} title={loadingTitle} isEmergency={isEmergencyMode} />;
      case 'quickLogin':
        return quickLoginUser && <QuickLoginForm user={quickLoginUser} onLoginResult={handleLoginResult} onExit={handleExitQuickLogin} autoOpen={autoOpen} isEmergency={isEmergencyMode} />;
      case 'auth':
        return (
          <div className="flex min-h-screen items-start justify-center p-4 pt-16 [perspective:1000px]">
             <div className={cn('relative w-full max-w-lg transition-transform duration-700 [transform-style:preserve-3d]', { '[transform:rotateY(180deg)]': isFlipped })}>
                <div className="absolute w-full [backface-visibility:hidden]">
                    <LoginForm 
                      onSignupClick={toggleAuthMode} 
                      onLoginResult={handleLoginResult} 
                      onHackEffectToggle={(active) => {
                          setIsHackEffectActive(active);
                          localStorage.setItem('isHackEffectActive', JSON.stringify(active));
                      }}
                      uiState={loginUiState}
                      setUiState={handleSetLoginUiState}
                      isLoginBlocked={isLoginBlocked}
                      setIsLoginBlocked={(blocked) => {
                          setIsLoginBlocked(blocked);
                          localStorage.setItem('isLoginBlocked', JSON.stringify(blocked));
                      }}
                      setLoadingTitle={(title) => {
                        handleSetName(title);
                        if(typeof window !== 'undefined') {
                            localStorage.setItem('loadingTitle', title);
                        }
                      }}
                      initialLoginUiState={initialLoginUiState}
                      isEmergencyMode={isEmergencyMode}
                      setIsEmergencyMode={(isEmergency) => {
                          setIsEmergencyMode(isEmergency);
                          localStorage.setItem('emergencyMode', JSON.stringify(isEmergency));
                      }}
                    />
                </div>
                <div className="absolute w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <SignupForm onLoginClick={toggleAuthMode} />
                </div>
            </div>
          </div>
        );
      case 'inQueue':
        return queuedUser && <LoginQueueScreen user={queuedUser} onComplete={handleFinalLogin} />;
      case 'loggedIn':
        return (
             <div className="flex min-h-screen items-center justify-center p-4">
                {loggedInUser && <LoggedInScreen user={loggedInUser} onLogout={handleLogout} />}
            </div>
        );
      case 'banned':
        return bannedDetails && <BannedScreen details={bannedDetails} />;
      case 'serverError':
        return <ServerErrorScreen />;
      case 'crashed':
        return <AiLoaderScreen onRestart={() => { setAppState('loading'); }} />;
      case 'deactivated':
        return <DeactivatedScreen onReactivate={() => router.push('/reactivate')} onBackToLogin={() => setAppState('auth')} />;
      case 'appSold':
        return <AppSoldScreen />;
      default:
        return <LoadingScreen onComplete={handleLoadingComplete} title={loadingTitle} isEmergency={isEmergencyMode} />;
    }
  };


  return (
    <main className={cn("relative flex min-h-screen flex-col items-center justify-center", { 'hack-effect': isHackEffectActive })}>
      <BackgroundImage />
       {isClient && isEmergencyMode && (
          <EmergencyBanner 
            onTurnOff={() => {
              setIsEmergencyMode(false);
              localStorage.setItem('emergencyMode', 'false');
            }} 
          />
        )}
      <div className="relative z-10 w-full">
        <CurrentScreen />
      </div>
    </main>
  );
}
