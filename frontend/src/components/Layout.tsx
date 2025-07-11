import React from 'react'
import { Outlet } from 'react-router-dom'

const Layout: React.FC = () => {
  return (
    <div>
      {/* Add header/nav/sidebar here if needed */}
      <Outlet />
    </div>
  )
}

export default Layout 