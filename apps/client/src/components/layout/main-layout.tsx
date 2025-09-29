import { Outlet } from 'react-router';
import NavBar from '../navigation/nav-bar';
import Footer from '../footer/footer';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-black/40">
            <header className="sticky top-0 z-50 w-full backdrop-blur-md">
                <NavBar />
            </header>
            <main className="flex-1 w-full">
                <Outlet />
            </main>
            <footer className="w-full mt-auto">
                <Footer />
            </footer>
        </div>
    );
};

export default MainLayout;