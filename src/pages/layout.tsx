import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@hooks/useAuth";
import HomeSvg from "@material-icons/svg/svg/home/outline.svg";
import WebAssetSvg from "@material-icons/svg/svg/web_asset/outline.svg";
import BrushSvg from "@material-icons/svg/svg/brush/outline.svg";
import TextAd from "@material-icons/svg/svg/text_snippet/outline.svg";
import Group from "@material-icons/svg/svg/group/outline.svg";
import Activity from "@material-icons/svg/svg/report/outline.svg";
import {
  getCurrentIssuerVersion,
  getCurrentWebUiVersion,
} from "../version-check";

const semver = require("semver");

export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [VersionWarningMessage, setVersionWarningMessage] = useState<
    string | null
  >(null);

  const clearWraningMessageTimeoutRef = useCallback(() => {
    if (VersionWarningMessage) {
      const timeout = setTimeout(() => {
        setVersionWarningMessage(null);
      }, 15000); // Clear warning after 15 seconds

      return () => clearTimeout(timeout);
    }
  }, [VersionWarningMessage]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const func = async () => {
      const currentwebUIVersion = getCurrentWebUiVersion();
      const currentIssuerVersion = await getCurrentIssuerVersion(
        process.env.PUBLIC_ISSUER,
      );

      // Extract major.minor version (e.g., "0.3" from "0.3.1")
      const webUIParts = currentwebUIVersion.split(".");
      const issuerParts = currentIssuerVersion.split(".");
      const webUIMajorMinor = `${webUIParts[0]}.${webUIParts[1]}.0`;
      const issuerMajorMinor = `${issuerParts[0]}.${issuerParts[1]}.0`;

      // Check if major.minor versions match (patch version differences are compatible)
      if (semver.gt(issuerMajorMinor, webUIMajorMinor)) {
        setVersionWarningMessage(
          `Warning: Your OpenAuthSter Web UI version (${currentwebUIVersion}) is not compatible with the current issuer version (${currentIssuerVersion}). Please update your Web UI to ensure compatibility and access to the latest features and security updates.`,
        );
      } else if (semver.gt(webUIMajorMinor, issuerMajorMinor)) {
        setVersionWarningMessage(
          `Warning: Your OpenAuthSter issuer version (${currentIssuerVersion}) is not compatible with the current Web UI version (${currentwebUIVersion}). Please update your issuer to ensure compatibility and access to the latest features and security updates.`,
        );
      }
    };
    func().then(() => clearWraningMessageTimeoutRef());
  }, []);

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
  if (!auth?.isLoaded) {
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
  if (!auth?.isAuthenticated && auth?.isLoaded) {
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
        {VersionWarningMessage && (
          <div className="fixed w-full top-0 left-0 z-50 flex items-center justify-center bg-yellow-600 text-yellow-100 ">
            <div className="px-4 py-2 text-sm text-center">
              {VersionWarningMessage}
            </div>
            <span
              className="absolute top-0 right-0 p-2 cursor-pointer"
              onClick={() => setVersionWarningMessage(null)}
            >
              X
            </span>
          </div>
        )}
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
              {auth?.isAuthenticated && (
                <span className="text-gray-400 text-sm">Logged in</span>
              )}
              <button
                onClick={() =>
                  auth?.logout().then(() => console.log("Logged out"))
                }
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
              {auth?.isAuthenticated && (
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

function NewVersionModale({
  webUIVersion,
  issuerVersion,
  latestUIVersion,
  latestIssuerVersion,
  onClose,
}: {
  webUIVersion: string | null;
  latestUIVersion: string | null;
  issuerVersion: string | null;
  latestIssuerVersion: string | null;
  onClose?: () => void;
}) {
  const displayWebUiVersion = webUIVersion ?? "unknown";
  const displayIssuerVersion = issuerVersion ?? "unknown";
  const displayLatestUIVersion = latestUIVersion ?? "unknown";
  const displayLatestIssuerVersion = latestIssuerVersion ?? "unknown";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
        <div className="relative bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
              <span className="text-lg">⬆</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                New Version Available
              </h2>
              <p className="text-sm text-blue-100">
                Update to keep your issuer and Web UI in sync.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="mb-5 overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800">
                  <th className="px-4 py-3 text-left font-semibold text-gray-300"></th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-300">
                    Current Version
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-300">
                    New Version
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700 bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-300">
                    Web UI
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-gray-700 px-3 py-1 font-medium text-gray-200">
                      {displayWebUiVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-green-900 px-3 py-1 font-medium text-green-300">
                      {displayLatestUIVersion}
                    </span>
                  </td>
                </tr>
                <tr className="bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-300">
                    Issuer
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-gray-700 px-3 py-1 font-medium text-gray-200">
                      {displayIssuerVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-green-900 px-3 py-1 font-medium text-green-300">
                      {displayLatestIssuerVersion}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-400">
            A new version of OpenAuthSter is available. Refresh to load the
            latest assets, or review the release notes before updating.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Refresh Now
            </button>
            <a
              href="https://github.com/shpaw415/OpenAuthSter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-600"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function isUserAwareOfTheNewVersion(version: string) {
  return localStorage.getItem(`newVersionAware-${version}`) === "true";
}

function setUserAwareOfTheNewVersion(version: string) {
  localStorage.setItem(`newVersionAware-${version}`, "true");
}
