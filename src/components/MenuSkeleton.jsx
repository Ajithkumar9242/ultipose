"use client"

export function MenuSkeleton({ count = 6 }) {
  const items = Array.from({ length: count });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {items.map((_, index) => (
        <div
          key={index}
          role="status"
          className="space-y-4 animate-pulse md:space-y-0 md:space-x-4 md:flex md:items-center border rounded-lg p-4"
        >
          {/* Left image skeleton */}
          <div className="flex items-center justify-center w-full h-32 bg-gray-200 rounded-lg md:w-40">
            <svg
              className="w-11 h-11 text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
              />
            </svg>
          </div>

          {/* Right text skeleton */}
          <div className="w-full">
            <div className="h-2.5 bg-gray-200 rounded-full w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full max-w-[480px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full max-w-[440px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full max-w-[460px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full max-w-[360px]"></div>
          </div>

          <span className="sr-only">Loading...</span>
        </div>
      ))}
    </div>
  );
}
