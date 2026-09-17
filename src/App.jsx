import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CustomerProvider } from './shared/context/CustomerContext'
import { CartProvider } from './shared/context/CartContext'
import ApiLoader from './shared/components/ApiLoader'
import Loader from './shared/components/Loader'
import WebsiteLayout from './website/layout/WebsiteLayout'
import Products from './website/pages/Products'
import Cart from './website/pages/Cart'
import OrderStatus from './website/pages/OrderStatus'
import NotFound from './website/pages/NotFound'

const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'))
const Dashboard = lazy(() => import('./admin/pages/Dashboard'))
const LiveOrders = lazy(() => import('./admin/pages/LiveOrders'))
const OrderSummary = lazy(() => import('./admin/pages/OrderSummary'))
const Items = lazy(() => import('./admin/pages/Items'))
const ComboItems = lazy(() => import('./admin/pages/ComboItems'))
const Coupons = lazy(() => import('./admin/pages/Coupons'))
const ReadyForPickup = lazy(() => import('./website/pages/ReadyForPickup'))

export default function App() {
  return (
    <CustomerProvider>
      <CartProvider>
        <ApiLoader />
        <BrowserRouter>
          <Routes>
            <Route element={<WebsiteLayout />}>
              <Route index element={<Products />} />
              <Route path="cart" element={<Cart />} />
              <Route path="order-status" element={<OrderStatus />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Dedicated Ready For Pickup Screen */}
            <Route
              path="/ready_for_pickup"
              element={
                <Suspense fallback={<Loader fullScreen size="lg" text="Loading Pickup Board..." subtext="Please wait a moment" />}>
                  <ReadyForPickup />
                </Suspense>
              }
            />
            <Route path="/ready-for-pickup" element={<Navigate to="/ready_for_pickup" replace />} />

            <Route
              path="/admin"
              element={
                <Suspense fallback={<Loader fullScreen size="lg" text="Loading Admin Portal..." subtext="Please wait a moment" />}>
                  <AdminLayout />
                </Suspense>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="live-orders" element={<LiveOrders />} />
              <Route path="order-summary" element={<OrderSummary />} />
              <Route path="items" element={<Items />} />
              <Route path="combo-items" element={<ComboItems />} />
              <Route path="coupons" element={<Coupons />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </CustomerProvider>
  )
}
