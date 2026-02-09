import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "openauth-react/client";
import HomeSvg from "@material-icons/svg/svg/home/outline.svg";
import WebAssetSvg from "@material-icons/svg/svg/web_asset/outline.svg";
import BrushSvg from "@material-icons/svg/svg/brush/outline.svg";
import TextAd from "@material-icons/svg/svg/text_snippet/outline.svg";
import Group from "@material-icons/svg/svg/group/outline.svg";
import Activity from "@material-icons/svg/svg/report/outline.svg";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = useMemo(
    () => [
      {
        href: "/",
        icon: <HomeSvg className="inline-block w-5 h-5 mr-1 fill-white" />,
        name: "Dashboard",
      },
      {
        href: "/templates",
        icon: <WebAssetSvg className="inline-block w-5 h-5 mr-1 fill-white" />,
        name: "Templates",
      },
      {
        href: "/theme",
        icon: <BrushSvg className="inline-block w-5 h-5 mr-1 fill-white" />,
        name: "UI theme",
      },
      {
        name: "Copy Text",
        href: "/copy",
        icon: <TextAd className="inline-block w-5 h-5 mr-1 fill-white" />,
      },
      {
        name: "Users",
        href: "/users",
        icon: <Group className="inline-block w-5 h-5 mr-1 fill-white" />,
      },
      {
        name: "Logs",
        href: "/activity",
        icon: <Activity className="inline-block w-5 h-5 mr-1 fill-white" />,
      },
    ],
    [],
  );

  // Show loading while checking auth
  if (!auth?.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!auth?.loggedIn && auth?.loaded) {
    setTimeout(() => {
      auth?.login();
      console.log(auth);
    }, 1000); // Slight delay to ensure smooth redirect

    return <RedirectToLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xl sm:text-2xl">🔐</span>
                <span className="text-lg sm:text-xl font-bold text-white">
                  OpenAuth Admin
                </span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {NavLinks.map((link) => (
                <NavLinkDesktop
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  name={link.name}
                />
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {auth?.loggedIn && (
                <span className="text-gray-400 text-sm">Logged in</span>
              )}
              <button
                onClick={auth?.logout}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-200 ease-in-out overflow-hidden ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pt-2 pb-4 space-y-1 bg-gray-800 border-t border-gray-700">
            {NavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                <span className="ml-2">{link.name}</span>
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-700">
              {auth?.loggedIn && (
                <p className="px-3 py-2 text-sm text-gray-400">Logged in</p>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  auth?.logout();
                }}
                className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

function RedirectToLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            <div
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-400 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}
            ></div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Redirecting to Login
        </h2>
        <p className="text-gray-400 text-sm">
          Please wait while we take you to the login page...
        </p>
        <div className="mt-4 flex justify-center gap-1">
          <span
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></span>
          <span
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></span>
          <span
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></span>
        </div>
      </div>
    </div>
  );
}

function NavLinkDesktop({
  href,
  icon,
  name,
}: {
  href: string;
  icon: ReactNode;
  name: string;
}) {
  return (
    <a href={href} className="text-gray-300 hover:text-white transition-colors">
      {icon} {name}
    </a>
  );
}
