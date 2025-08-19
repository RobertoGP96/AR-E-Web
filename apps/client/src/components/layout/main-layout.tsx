import { Outlet } from 'react-router';
import NavBar from '../navigation/nav-bar';
import Footer from '../footer/footer';

const MainLayout = () => {
    return (
        <div className="bg-black h-full">
            <NavBar />
            <Outlet />
            <Footer/>
        </div>
    );
};

export default MainLayout;