// app/page.js
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { ModeToggle } from '@/components/ToggleTheme';
import Network3D from '@/components/Network3D';

export default function LandingPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  const { login } = useLogin({
    onComplete: () => router.push("/onboarding"),
    onError: (err) => console.error("Privy login failed:", err),
  });

  // 인증된 사용자는 자동으로 onboarding으로 리다이렉트
  useEffect(() => {
    if (ready && authenticated) {
      router.push("/onboarding");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    // 1. 감시자(Observer) 생성
    const observer = new IntersectionObserver(
      (entries) => {
        // 감시 대상들에게 변화가 생기면 실행
        entries.forEach((entry) => {
          // 2. 요소가 화면에 보이는지 확인
          if (entry.isIntersecting) {
            // 3. 보인다면 is-visible 클래스 추가 (애니메이션 시작!)
            entry.target.classList.add('is-visible');
            // 한 번 실행 후 감시 중단
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 } // 요소가 10% 보였을 때 실행
    );

    // 4. 애니메이션을 적용할 모든 요소를 선택
    const elements = document.querySelectorAll('.animate-on-scroll');
    // 각 요소를 감시하도록 등록
    elements.forEach((el) => observer.observe(el));

    // 컴포넌트가 사라질 때 감시자 정리
    return () => observer.disconnect();
  }, []);

  const disabled = !ready || (ready && authenticated);

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-white dark:bg-[#0a0f1a] font-display text-gray-900 dark:text-gray-100 relative">
      {/* 전체 페이지 3D 네트워크 배경 */}
      <Network3D />
      
      {/* ================= Header ================= */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <svg className="h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" fill="currentColor" viewBox="0 0 48 48">
                <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z"></path>
              </svg>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Commputation</h2>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="#features" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-all duration-300 relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="#solutions" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-all duration-300 relative group">
                Solutions
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="#resources" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-all duration-300 relative group">
                Resources
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <ModeToggle />
              <button 
                onClick={() => login()} 
                disabled={disabled}
                className="hidden sm:inline-flex items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Log In
              </button>
              <button 
                onClick={() => login()} 
                disabled={disabled}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-light hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= Main Content ================= */}
      <main>
        {/* --- Hero Section --- */}
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden z-10">
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-48 z-10">
            <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent animate-shimmer">
                Build and Incentivize Your Future: The Web3 Collaboration Platform
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-700 dark:text-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Seamlessly create on-chain communities, manage projects, and reward contributions with transparent token-based systems.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <button 
                  onClick={() => login()} 
                  disabled={disabled}
                  className="group relative rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                >
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
                <button 
                  onClick={() => login()} 
                  disabled={disabled}
                  className="group relative rounded-lg bg-gray-900/10 dark:bg-white/10 px-8 py-4 text-base font-bold text-gray-900 dark:text-gray-100 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-gray-900/20 dark:hover:bg-white/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/40"
                >
                  Explore Projects
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- Features Section --- */}
        <section id="features" className="w-full min-h-screen flex flex-col items-center justify-center py-16 lg:py-24 relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16 animate-on-scroll">
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Core Features for Decentralized Success
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Commpution is a revolutionary platform that leverages Web3 technology to redefine collaboration. Our core features are designed to foster community ownership, reward contributions, and streamline project management, ensuring a transparent and efficient workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-8 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-on-scroll" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-6">
                  <svg className="text-primary" height="32" viewBox="0 0 256 256" width="32" fill="currentColor">
                    <path d="M117.25 157.92a60 60 0 1 0-66.5 0A95.83 95.83 0 0 0 3.37 192a8 8 0 1 0 14.12 7.61 80.11 80.11 0 0 1 140.78-7.61 8 8 0 1 0 14.12-7.61 95.83 95.83 0 0 0-55.14-34.08ZM44 108a44 44 0 1 1 44 44 44.05 44.05 0 0 1-44-44Zm164.77 60.77a8 8 0 0 1 .23-11.32 40 40 0 1 0-11.32 11.31 8 8 0 0 1 11.09-.23Zm-18.87-18.88a8 8 0 0 1 .23-11.31 24 24 0 1 0-11.32 11.32 8 8 0 0 1 11.09-.23Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Community Ownership</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Experience true decentralization with on-chain governance, where every member has a voice in the platform's direction. Our transparent management system ensures fairness and accountability.</p>
              </div>
              {/* Feature Card 2 */}
              <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-8 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-on-scroll" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-6">
                  <svg className="text-primary" height="32" viewBox="0 0 256 256" width="32" fill="currentColor">
                    <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88 88.1 88.1 0 0 1-88 88Zm48-88a8 8 0 0 1-8 8h-32v32a8 8 0 0 1-16 0v-32H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v32h32a8 8 0 0 1 8 8Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contribution Rewards</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Our platform automatically allocates tokens based on completed work and contributions, ensuring fair and timely rewards for every participant. Track your earnings and contributions effortlessly.</p>
              </div>
              {/* Feature Card 3 */}
              <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-8 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-on-scroll" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-6">
                  <svg className="text-primary" height="32" viewBox="0 0 256 256" width="32" fill="currentColor">
                    <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Seamless Project Management</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Create projects, distribute tasks, and track contributions with ease. Our intuitive interface simplifies project management, allowing you to focus on achieving your goals without administrative overhead.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Token Section --- */}
        <section className="w-full min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center animate-on-scroll">
                    <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
                        Your Impact, Your Token Value
                    </h2>
                    <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                        BBL tokens are distributed to team members, leaders, faculty, and alumni, serving as an influence indicator within the Commpution community.
                    </p>
                </div>
                <div className="mt-12 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 animate-on-scroll" style={{ '--animation-delay': '0.2s' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col justify-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">How It Works</h3>
                            <p className="mt-4 text-gray-700 dark:text-gray-300">
                                Our system ensures that contributions are transparently recognized and valued, fostering a collaborative and rewarding environment. Your influence grows with your impact.
                            </p>
                            <div className="mt-6">
                                <Link href="#" className="inline-block bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h4>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">Receive tokens for active participation and successful project contributions.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Leaders & Faculty</h4>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">Earn tokens for mentorship, guidance, and community leadership.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5m0 0V4m0 5v2m0 2v1m0 1v1m0 1v1m0-13a9 9 0 110 18 9 9 0 010-18z"></path></svg>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Alumni Network</h4>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">Stay engaged and get rewarded for long-term community support.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Join Ecosystem Section --- */}
        <section className="w-full min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="w-full max-w-4xl mx-auto animate-on-scroll">
                <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-md p-8 sm:p-12 md:p-16 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                            Join the BBL Web3 Ecosystem Today
                        </h1>
                        <p className="max-w-3xl mx-auto text-lg text-gray-700 dark:text-gray-300 mb-8">
                            Sign up easily with your personal Google email and immediately receive BBL token rewards for your contributions.
                        </p>
                    </div>
                    <div className="mt-10 flex justify-center">
                        <button 
                          onClick={() => login()} 
                          disabled={disabled}
                          className="flex items-center justify-center gap-3 bg-primary text-white font-bold py-4 px-10 rounded-lg text-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path>
                                <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path>
                                <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-8H6.393c3.56,9.255,12.723,16,23.607,16H24z" fill="#4CAF50"></path>
                                <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C44.437,36.218,48,30.455,48,24C48,22.659,47.862,21.35,47.611,20.083z" fill="#1976D2"></path>
                            </svg>
                            <span>Sign Up with Google</span>
                        </button>
                    </div>
                    <div className="mt-8 text-center text-sm text-red-400 space-y-1">
                        <p className="font-bold uppercase tracking-wider">DO NOT use SBU email.</p>
                        <p className="text-gray-400">Personal email required for token wallet connection.</p>
                    </div>
                </div>
            </div>
        </section>
      </main>
      
      {/* ================= Footer ================= */}
      <footer className="text-center text-sm text-gray-400 dark:text-gray-500 py-6 border-t border-gray-700/50 dark:border-gray-800/50 relative z-10">
        © {new Date().getFullYear()} Commputation. All rights reserved.
      </footer>
    </div>
  );
}