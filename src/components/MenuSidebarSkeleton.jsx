"use client"

export function MenuSidebarSkeleton() {
  return (
    <aside
      className="
        hidden lg:block
        w-64 border-r border-gray-200 p-4
        sticky top-[96px] self-start
        max-h-[calc(100vh-96px)] overflow-y-auto
      "
    >
      <div
        role="status"
        className="
          max-w-full p-4 
          border border-gray-200 
          divide-y divide-gray-200 
          rounded-lg shadow-sm 
          animate-pulse
        "
      >
        {/* Row 1 */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
            <div className="w-32 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-2.5 bg-gray-300 rounded-full w-12"></div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
            <div className="w-32 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-2.5 bg-gray-300 rounded-full w-12"></div>
        </div>

        {/* Row 3 */}
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
            <div className="w-32 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-2.5 bg-gray-300 rounded-full w-12"></div>
        </div>

        {/* Row 4 */}
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
            <div className="w-32 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-2.5 bg-gray-300 rounded-full w-12"></div>
        </div>

        {/* Row 5 */}
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
            <div className="w-32 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-2.5 bg-gray-300 rounded-full w-12"></div>
        </div>

        <span className="sr-only">Loading...</span>
      </div>
    </aside>
  )
}
