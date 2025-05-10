import {Link} from "react-router-dom";
import {useContext} from "react";
import {UserContext} from "./UserContext.jsx";

export default function Header() {
  const {user} = useContext(UserContext);
  const headerStyle = {
    backgroundImage: `url('E:\airbnb-clone-master (4)\airbnb-clone-master\client\src\assets\back.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <header
      style={headerStyle}
      className="w-full sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-md shadow-md"
    >
      {/* Logo & Branding */}
      <Link to={'/'} className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 rotate-[-90deg] text-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        <span className="font-extrabold text-2xl text-gray-800">MaitriStay</span>
      </Link>

      {/* Search Bar */}
      <div className="hidden sm:flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-lg transition-shadow duration-200 gap-2 bg-white/70 backdrop-blur-sm">
        <div className="text-gray-600 font-medium">Anywhere</div>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="text-gray-600 font-medium">Any week</div>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="text-gray-600 font-medium">Add guests</div>
        <button className="bg-primary text-white p-2 rounded-full ml-2 hover:bg-primary-dark transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>

      {/* User Menu */}
      <Link to={user ? '/account' : '/login'} className="flex items-center gap-3 border border-gray-300 rounded-full py-2 px-4 hover:shadow-md transition-shadow duration-200 bg-white/70 backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <div className="relative">
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
          {user && <span className="absolute -top-2 -right-2 bg-green-500 border-2 border-white w-3 h-3 rounded-full"></span>}
        </div>
        {user && <span className="text-gray-700 font-medium">{user.name}</span>}
      </Link>

      {/* Mobile Search & Menu Toggle */}
      <button className="sm:hidden ml-2 p-2 bg-primary text-white rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
        </svg>
      </button>
    </header>
  );
}
