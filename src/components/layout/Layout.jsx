import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

/**
 * App shell layout with fixed navigation.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export const Layout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-primary-light text-slate-900">
    <Topbar />
    <Sidebar />
    <main className="min-h-screen pt-12 md:pl-16 lg:pl-[220px]">
      <div className="animate-fade-in px-4 py-5 md:px-6 lg:px-8 lg:py-6">{children}</div>
    </main>
  </div>
);

export default Layout;
