import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from '../navigation/nav-bar';
import Footer from '../footer/footer';

const LoadingFallback = (
    <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
);

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-black/40 relative">
            <header className="sticky top-0 w-full backdrop-blur-md" style={{ zIndex: 100000 }}>
                <NavBar />
            </header>
            <main className="flex-1 w-full relative overflow-visible">
                <Suspense fallback={LoadingFallback}>
                    <Outlet />
                </Suspense>
            </main>
            <footer className="w-full mt-auto">
                <Footer />
            </footer>
        </div>
    );
};

export default MainLayout;