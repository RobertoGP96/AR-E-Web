import { Outlet } from 'react-router-dom';
import NavBar from '../navigation/nav-bar';
import Footer from '../footer/footer';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-black/40 relative">
            <header className="sticky top-0 w-full backdrop-blur-md" style={{ zIndex: 100000 }}>
                <NavBar />
            </header>
            <main className="flex-1 w-full relative overflow-visible">
                <Outlet />
            </main>
            <footer className="w-full mt-auto">
                <Footer />
            </footer>
        </div>
    );
};

export default MainLayout;