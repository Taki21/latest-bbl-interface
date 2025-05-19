import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-white border-b-2 border-red-500 p-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-red-500 font-bold text-xl">
          <Link href="/">Brand</Link>
        </div>
        <div>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="text-gray-700 hover:text-red-500">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-gray-700 hover:text-red-500">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-700 hover:text-red-500">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
