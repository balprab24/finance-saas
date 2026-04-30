import Link from 'next/link';
import { CircleDollarSign } from 'lucide-react';

export function HeaderLogo() {
  return (
    <Link href="/dashboard">
      <div className="items-center hidden lg:flex">
        <CircleDollarSign className="size-7 text-white" />
        <p className="font-semibold text-white text-2xl ml-2.5">Finance</p>
      </div>
    </Link>
  );
}
