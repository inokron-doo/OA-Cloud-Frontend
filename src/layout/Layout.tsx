
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex w-full">

            {/* Fixed Navbar */}
            <div className="fixed top-0 left-0 w-full z-50">
                <Navbar />
            </div>
            {/* Fixed Sidebar */}
            <div className="fixed top-0 left-0 h-screen w-0 lg:w-64 pt-19 z-50">
                <Sidebar />
            </div>

            {/* Main Content (scrollable) */}
            {/* lg:ml-64  */}
            <main className="flex-1 w-full min-h-screen bg-gray-50 p-6 px-5 sm:px-6 pt-13 lg:pl-69 lg:pt-19">
                {children}
            </main>
        </div>
    );
};

export default Layout;